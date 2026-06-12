import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Heart, LoaderCircle, LocateFixed, MapPin, RefreshCcw, Sparkles } from 'lucide-react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import VerifiedBadge from './VerifiedBadge'
import { supabase } from '../supabaseClient'
import { DAILY_UNVERIFIED_LIKE_LIMIT, getRemainingLikesToday, getStartOfTodayIso, isProfileVerified } from '../utils/verification'

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11'
const RADAR_RADIUS_KM = 5
const DEFAULT_VIEW_STATE = {
  longitude: 116.3974,
  latitude: 39.9093,
  zoom: 11.6,
}
const DEMO_COORDINATES = {
  latitude: 31.2304,
  longitude: 121.4737,
}

function toRadarErrorMessage(error, fallbackText) {
  const rawMessage = error instanceof Error ? error.message : String(error || '')
  const normalized = rawMessage.toLowerCase()

  if (
    normalized.includes('column profiles.latitude does not exist') ||
    normalized.includes('column profiles.longitude does not exist') ||
    normalized.includes('latitude does not exist') ||
    normalized.includes('longitude does not exist')
  ) {
    return '数据库里还没有经纬度字段。请先执行 `supabase_location_radar.sql`，再回来刷新同城雷达。'
  }

  return rawMessage || fallbackText
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return '未知距离'
  }

  if (distanceKm < 1) {
    return `${Math.max(80, Math.round(distanceKm * 1000))}m`
  }

  return `${distanceKm.toFixed(1)}km`
}

function haversineDistanceKm(from, to) {
  const toRad = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const deltaLatitude = toRad(to.latitude - from.latitude)
  const deltaLongitude = toRad(to.longitude - from.longitude)
  const latitude1 = toRad(from.latitude)
  const latitude2 = toRad(to.latitude)

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
}

function buildAvatar(profile) {
  return (
    profile.avatar_url?.trim() ||
    `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.nickname || profile.id)}`
  )
}

function StateCard({ title, description, actionLabel, onAction, helperText, icon = AlertCircle, loading = false }) {
  const Icon = icon

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] border border-pink-100 bg-slate-950/80 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-pink-500/12 text-pink-300">
        {loading ? <LoaderCircle className="h-8 w-8 animate-spin" /> : <Icon className="h-8 w-8" />}
      </div>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-3 text-base leading-8 text-slate-300">{description}</p>
      {helperText && <p className="mt-3 text-sm leading-7 text-slate-400">{helperText}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default function MapRadar({ currentUserId, currentUserProfile, onProfileUpdated }) {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE)
  const [userLocation, setUserLocation] = useState(() =>
    currentUserProfile?.latitude && currentUserProfile?.longitude
      ? {
          latitude: Number(currentUserProfile.latitude),
          longitude: Number(currentUserProfile.longitude),
        }
      : null,
  )
  const [nearbyProfiles, setNearbyProfiles] = useState([])
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [dailyLikeCount, setDailyLikeCount] = useState(0)

  const targetGender = useMemo(() => {
    if (currentUserProfile?.gender === 'male') {
      return 'female'
    }

    if (currentUserProfile?.gender === 'female') {
      return 'male'
    }

    return null
  }, [currentUserProfile?.gender])

  const selectedProfile = useMemo(
    () => nearbyProfiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [nearbyProfiles, selectedProfileId],
  )

  const persistCurrentLocation = useCallback(
    async (coords) => {
      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', currentUserId)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      onProfileUpdated?.(data)
      return data
    },
    [currentUserId, onProfileUpdated],
  )

  const loadNearbyProfiles = useCallback(
    async (coords) => {
      if (!coords || !targetGender) {
        setIsLoadingProfiles(false)
        setNearbyProfiles([])
        setSelectedProfileId(null)
        return
      }

      setIsLoadingProfiles(true)
      setLoadError('')

      const [profilesResult, likesResult, likeCountResult] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, nickname, gender, age, avatar_url, bio, interests, is_verified, latitude, longitude, location_updated_at, created_at',
          )
          .eq('gender', targetGender)
          .neq('id', currentUserId)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('created_at', { ascending: true }),
        supabase.from('likes').select('to_user, status').eq('from_user', currentUserId),
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('from_user', currentUserId)
          .eq('status', 'like')
          .gte('created_at', getStartOfTodayIso()),
      ])

      if (profilesResult.error) {
        setLoadError(`读取同城资料失败：${toRadarErrorMessage(profilesResult.error, '请稍后再试。')}`)
        setNearbyProfiles([])
        setSelectedProfileId(null)
        setIsLoadingProfiles(false)
        return
      }

      if (likesResult.error) {
        setLoadError(`读取心动记录失败：${toRadarErrorMessage(likesResult.error, '请稍后再试。')}`)
        setNearbyProfiles([])
        setSelectedProfileId(null)
        setIsLoadingProfiles(false)
        return
      }

      if (likeCountResult.error) {
        setLoadError(`读取今日心动次数失败：${toRadarErrorMessage(likeCountResult.error, '请稍后再试。')}`)
        setNearbyProfiles([])
        setSelectedProfileId(null)
        setIsLoadingProfiles(false)
        return
      }

      const likedSet = new Set((likesResult.data ?? []).filter((item) => item.status === 'like').map((item) => item.to_user))

      const profiles = (profilesResult.data ?? [])
        .map((profile) => {
          const latitude = Number(profile.latitude)
          const longitude = Number(profile.longitude)
          const distanceKm = haversineDistanceKm(coords, { latitude, longitude })

          return {
            ...profile,
            latitude,
            longitude,
            distanceKm,
            distanceLabel: formatDistance(distanceKm),
            avatar: buildAvatar(profile),
            tags: Array.isArray(profile.interests) ? profile.interests : [],
            liked: likedSet.has(profile.id),
            is_verified: Boolean(profile.is_verified),
          }
        })
        .filter((profile) => Number.isFinite(profile.distanceKm) && profile.distanceKm <= RADAR_RADIUS_KM)
        .sort((first, second) => first.distanceKm - second.distanceKm)

      setNearbyProfiles(profiles)
      setDailyLikeCount(likeCountResult.count ?? 0)
      setSelectedProfileId((currentId) => {
        if (currentId && profiles.some((profile) => profile.id === currentId)) {
          return currentId
        }

        return profiles[0]?.id ?? null
      })
      setIsLoadingProfiles(false)
    },
    [currentUserId, targetGender],
  )

  const requestCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('当前设备不支持浏览器定位，请换用支持 GPS 的浏览器或手机。')
      return
    }

    setIsLocating(true)
    setLocationError('')
    setActionMessage('')

    try {
      const coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 120000,
          },
        )
      })

      await persistCurrentLocation(coords)
      setUserLocation(coords)
      setViewState((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
        zoom: Math.max(prev.zoom, 12.6),
      }))
      await loadNearbyProfiles(coords)
    } catch (error) {
      setLocationError(toRadarErrorMessage(error, '定位失败，请确认浏览器已经允许位置权限。'))
    } finally {
      setIsLocating(false)
    }
  }, [loadNearbyProfiles, persistCurrentLocation])

  const applyDemoCoordinates = useCallback(async () => {
    setIsLocating(true)
    setLocationError('')
    setActionMessage('')

    try {
      await persistCurrentLocation(DEMO_COORDINATES)
      setUserLocation(DEMO_COORDINATES)
      setViewState((prev) => ({
        ...prev,
        latitude: DEMO_COORDINATES.latitude,
        longitude: DEMO_COORDINATES.longitude,
        zoom: Math.max(prev.zoom, 12.6),
      }))
      await loadNearbyProfiles(DEMO_COORDINATES)
      setActionMessage('已写入演示坐标，适合在本地或无定位权限环境里继续联调。')
    } catch (error) {
      setLocationError(toRadarErrorMessage(error, '写入演示坐标失败，请稍后再试。'))
    } finally {
      setIsLocating(false)
    }
  }, [loadNearbyProfiles, persistCurrentLocation])

  useEffect(() => {
    if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
      const coords = {
        latitude: Number(currentUserProfile.latitude),
        longitude: Number(currentUserProfile.longitude),
      }

      const timer = window.setTimeout(() => {
        void loadNearbyProfiles(coords)
      }, 0)

      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      void requestCurrentLocation()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [
    currentUserProfile?.id,
    currentUserProfile?.latitude,
    currentUserProfile?.longitude,
    loadNearbyProfiles,
    requestCurrentLocation,
  ])

  const createMatchRecord = useCallback(
    async (profileId) => {
      const userA = [currentUserId, profileId].sort()[0]
      const userB = [currentUserId, profileId].sort()[1]

      const { data, error } = await supabase
        .from('matches')
        .upsert(
          {
            user_a: userA,
            user_b: userB,
          },
          { onConflict: 'user_a,user_b' },
        )
        .select('*')
        .single()

      if (error) {
        throw error
      }

      return data
    },
    [currentUserId],
  )

  const handleLike = async () => {
    if (!selectedProfile || isLiking) {
      return
    }

    if (!isProfileVerified(currentUserProfile) && dailyLikeCount >= DAILY_UNVERIFIED_LIKE_LIMIT) {
      setActionMessage(`未认证用户每天最多喜欢 ${DAILY_UNVERIFIED_LIKE_LIMIT} 次，完成真人认证后可解除限制。`)
      return
    }

    setIsLiking(true)
    setActionMessage('')

    try {
      const { error } = await supabase.from('likes').upsert(
        {
          from_user: currentUserId,
          to_user: selectedProfile.id,
          status: 'like',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'from_user,to_user' },
      )

      if (error) {
        throw error
      }

      const { data: reverseLike, error: reverseError } = await supabase
        .from('likes')
        .select('id, status')
        .eq('from_user', selectedProfile.id)
        .eq('to_user', currentUserId)
        .eq('status', 'like')
        .maybeSingle()

      if (reverseError) {
        throw reverseError
      }

      let nextMessage = `已向 ${selectedProfile.nickname} 发出心动信号。`

      if (reverseLike) {
        await createMatchRecord(selectedProfile.id)
        nextMessage = `你和 ${selectedProfile.nickname} 刚刚匹配成功了。`
      }

      setNearbyProfiles((prev) =>
        prev.map((profile) => (profile.id === selectedProfile.id ? { ...profile, liked: true } : profile)),
      )
      setDailyLikeCount((prev) => prev + 1)
      setActionMessage(nextMessage)
    } catch (error) {
      setActionMessage(toRadarErrorMessage(error, '发送心动失败，请稍后再试。'))
    } finally {
      setIsLiking(false)
    }
  }

  const nearestHint = nearbyProfiles[0] ? `最近的缘分距离你 ${nearbyProfiles[0].distanceLabel}` : '雷达范围内暂时还没人出现'
  const remainingLikesToday = getRemainingLikesToday(currentUserProfile, dailyLikeCount)

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.22),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.22),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#111827_58%,_#111827_100%)] px-4 pb-32 pt-8">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
          <StateCard
            title="Mapbox 还没有准备好"
            description="当前环境未读取到 `VITE_MAPBOX_ACCESS_TOKEN`，所以无法加载粉黑极简地图。"
            helperText="请确认 `.env` 已经配置好 Mapbox Token，并重启前端开发服务。"
            actionLabel={import.meta.env.DEV ? '使用演示坐标继续联调' : undefined}
            onAction={import.meta.env.DEV ? () => void applyDemoCoordinates() : undefined}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.22),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.22),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#111827_58%,_#111827_100%)] px-4 pb-32 pt-8">
      <div className="pointer-events-none absolute inset-0 opacity-60 radar-grid-overlay" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[30px] border border-white/10 bg-slate-950/55 px-5 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4" />
              同城寻缘雷达地图
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">打开雷达，看看 5 公里内有哪些缘分正在发光</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              开启定位后，系统会把你的实时经纬度更新到 `profiles` 表，再从 Supabase 中筛出附近的异性用户。点头像即可查看微型资料卡，并一键发送心动。
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{nearestHint}</div>
            <div className="text-xs text-slate-400">
              {isProfileVerified(currentUserProfile)
                ? '你已完成真人认证，雷达页的心动次数不受限制。'
                : `未认证用户今日还可喜欢 ${remainingLikesToday} 次，完成真人认证后可解除限制。`}
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                type="button"
                onClick={() => void requestCurrentLocation()}
                disabled={isLocating}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLocating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                {userLocation ? '刷新我的定位' : '开启雷达定位'}
              </button>

              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={() => void applyDemoCoordinates()}
                  disabled={isLocating}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <MapPin className="h-4 w-4" />
                  使用演示坐标
                </button>
              )}
            </div>
          </div>
        </div>

        {locationError && (
          <div className="rounded-[26px] border border-rose-200/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100 shadow-lg shadow-rose-950/20">
            定位提示：{locationError}
          </div>
        )}

        {loadError && (
          <div className="rounded-[26px] border border-rose-200/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100 shadow-lg shadow-rose-950/20">
            数据读取提示：{loadError}
          </div>
        )}

        {actionMessage && (
          <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-50 shadow-lg shadow-cyan-950/20">
            {actionMessage}
          </div>
        )}

        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-slate-950/70 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="absolute left-6 top-6 z-10 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-medium tracking-[0.3em] text-cyan-200 uppercase">
            Radar Live
          </div>

          <div className="h-[72vh] min-h-[520px]">
            <Map
              {...viewState}
              onMove={(event) => setViewState(event.viewState)}
              mapStyle={MAPBOX_STYLE}
              mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
              attributionControl={false}
              reuseMaps
              onClick={() => setSelectedProfileId(null)}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" />

              {userLocation && (
                <Marker latitude={userLocation.latitude} longitude={userLocation.longitude} anchor="center">
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-cyan-400/35" />
                    <span className="absolute inline-flex h-9 w-9 rounded-full border border-cyan-100/70 bg-cyan-300/25 backdrop-blur" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
                  </div>
                </Marker>
              )}

              {nearbyProfiles.map((profile) => {
                const isSelected = selectedProfileId === profile.id

                return (
                  <Marker key={profile.id} latitude={profile.latitude} longitude={profile.longitude} anchor="center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedProfileId(profile.id)
                      }}
                      className={`relative flex h-18 w-18 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? 'scale-110 border-pink-200/80 shadow-[0_0_0_8px_rgba(244,114,182,0.12)]'
                          : 'border-white/25'
                      }`}
                    >
                      <span className={`absolute inset-0 rounded-full radar-marker-pulse ${profile.liked ? 'bg-cyan-400/24' : 'bg-pink-400/24'}`} />
                      <span className="absolute inset-[5px] rounded-full bg-slate-950/55 backdrop-blur" />
                      <img src={profile.avatar} alt={`${profile.nickname} 的头像`} className="relative z-10 h-14 w-14 rounded-full object-cover" />
                    </button>
                  </Marker>
                )
              })}
            </Map>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/74 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-5">
            {isLoadingProfiles ? (
              <div className="w-full max-w-2xl">
                <StateCard
                  title="正在扫描附近缘分"
                  description="地图正在读取 5 公里范围内的异性资料，请稍等片刻。"
                  helperText="只会展示已经写入经纬度，并且当前距离在 5 公里内的用户。"
                  loading
                />
              </div>
            ) : selectedProfile ? (
              <div className="w-full max-w-3xl rounded-[30px] border border-white/10 bg-slate-950/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.5)] backdrop-blur-xl">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <span className="absolute inline-flex h-20 w-20 rounded-full bg-pink-400/16" />
                      <img src={selectedProfile.avatar} alt={`${selectedProfile.nickname} 的头像`} className="relative h-16 w-16 rounded-full object-cover ring-2 ring-white/20" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold text-white">
                          {selectedProfile.nickname}
                          {selectedProfile.is_verified && (
                            <span className="ml-2 inline-flex align-middle">
                              <VerifiedBadge compact />
                            </span>
                          )}{' '}
                          <span className="text-slate-400">{selectedProfile.age}</span>
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                          <MapPin className="h-3.5 w-3.5" />
                          距离你 {selectedProfile.distanceLabel}
                        </span>
                      </div>
                      <p className="max-w-2xl text-sm leading-7 text-slate-300">
                        {selectedProfile.bio?.trim() || '资料正在慢慢完善中，也许先从一句温柔的问候开始更合适。'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-3 md:w-[230px]">
                    <button
                      type="button"
                      onClick={() => void handleLike()}
                      disabled={
                        isLiking ||
                        selectedProfile.liked ||
                        (!isProfileVerified(currentUserProfile) && remainingLikesToday <= 0)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLiking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                      {selectedProfile.liked ? '已发送心动' : '心动点赞'}
                    </button>
                    <p className="text-center text-xs leading-6 text-slate-400">
                      点击头像可以快速切换查看，点击地图空白处会收起资料卡。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950/74 px-5 py-4 text-center text-sm leading-7 text-slate-300 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                {nearbyProfiles.length
                  ? '点一下地图上的头像气泡，就能展开这位附近缘分的微型资料卡。'
                  : '雷达范围内暂时没有可展示的异性资料。你可以刷新定位，或先让更多用户补齐经纬度。'}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
