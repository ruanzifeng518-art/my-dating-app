import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Camera, CheckCircle2, LoaderCircle, ScanFace, ShieldCheck, Sparkles } from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'
const ACTIONS = [
  {
    key: 'blink',
    title: '请在 3 秒内眨眨眼',
    hint: '保持头部稳定，轻轻闭眼再睁开。',
  },
  {
    key: 'turn',
    title: '请在 3 秒内向任意一侧转头',
    hint: '缓慢转动头部，不需要离开画面。',
  },
]

let faceApiPromise
let modelLoadPromise

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getEyeAspectRatio(points) {
  if (!points || points.length < 6) {
    return 0
  }

  return (distance(points[1], points[5]) + distance(points[2], points[4])) / (2 * distance(points[0], points[3]))
}

function getHeadTurnRatio(landmarks) {
  const jaw = landmarks.getJawOutline()
  const nose = landmarks.getNose()

  if (!jaw?.length || !nose?.length) {
    return 0.5
  }

  const left = jaw[0]
  const right = jaw[jaw.length - 1]
  const noseTip = nose[Math.floor(nose.length / 2)]
  const width = Math.max(1, right.x - left.x)

  return (noseTip.x - left.x) / width
}

async function ensureFaceApi() {
  if (!faceApiPromise) {
    faceApiPromise = import('face-api.js')
  }

  return faceApiPromise
}

async function ensureModelsLoaded() {
  const faceapi = await ensureFaceApi()

  if (!modelLoadPromise) {
    modelLoadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ])
  }

  await modelLoadPromise
  return faceapi
}

export default function LivenessVerificationCard({
  isVerified,
  onVerifySuccess,
  getProfilePayload,
  errorMessage,
  compact = false,
}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const processingRef = useRef(false)
  const baselineEarRef = useRef([])
  const baselineTurnRef = useRef([])

  const [phase, setPhase] = useState(isVerified ? 'verified' : 'idle')
  const [statusText, setStatusText] = useState(isVerified ? '认证已通过，昵称后会永久显示蓝底白勾。' : '')
  const [action, setAction] = useState(null)
  const [countdown, setCountdown] = useState(3)

  const title = useMemo(() => {
    if (isVerified || phase === 'verified') {
      return '真人认证已完成'
    }

    return 'AI 真人活体认证'
  }, [isVerified, phase])

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    processingRef.current = false
    baselineEarRef.current = []
    baselineTurnRef.current = []
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const handleSuccess = useCallback(async () => {
    if (processingRef.current) {
      return
    }

    processingRef.current = true
    stopCamera()
    setPhase('saving')
    setStatusText('动作识别成功，正在写入认证状态...')

    try {
      const payload = {
        ...getProfilePayload(),
        is_verified: true,
      }

      await onVerifySuccess(payload)
      setPhase('verified')
      setStatusText('真人认证通过，蓝底白勾徽章已点亮。')
    } catch (error) {
      setPhase('failed')
      setStatusText(error instanceof Error ? error.message : '认证写入失败，请稍后重试。')
    } finally {
      processingRef.current = false
    }
  }, [getProfilePayload, onVerifySuccess, stopCamera])

  const beginDetection = useCallback(
    async (selectedAction) => {
      const faceapi = await ensureModelsLoaded()
      const startedAt = Date.now()

      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current || processingRef.current) {
          return
        }

        const remainingMs = 3000 - (Date.now() - startedAt)
        const nextCountdown = Math.max(0, Math.ceil(remainingMs / 1000))
        setCountdown(nextCountdown)

        if (remainingMs <= 0) {
          stopCamera()
          setPhase('failed')
          setStatusText('这次没有识别到指定动作，请再试一次。')
          return
        }

        processingRef.current = true

        try {
          const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }))
            .withFaceLandmarks(true)

          if (!result) {
            setStatusText('请正对摄像头，保持光线充足。')
            return
          }

          const landmarks = result.landmarks
          const currentEar =
            (getEyeAspectRatio(landmarks.getLeftEye()) + getEyeAspectRatio(landmarks.getRightEye())) / 2
          const currentTurn = getHeadTurnRatio(landmarks)

          if (baselineEarRef.current.length < 6) {
            baselineEarRef.current.push(currentEar)
          }

          if (baselineTurnRef.current.length < 6) {
            baselineTurnRef.current.push(currentTurn)
          }

          const baselineEar =
            baselineEarRef.current.reduce((total, value) => total + value, 0) / Math.max(1, baselineEarRef.current.length)
          const baselineTurn =
            baselineTurnRef.current.reduce((total, value) => total + value, 0) /
            Math.max(1, baselineTurnRef.current.length)

          if (selectedAction.key === 'blink') {
            setStatusText('请正对摄像头，保持光线充足。检测到眨眼后会自动通过。')

            if (baselineEarRef.current.length >= 4 && currentEar < baselineEar * 0.72) {
              await handleSuccess()
            }

            return
          }

          setStatusText('请保持在圆框内，轻轻向任意一侧转头。')

          if (baselineTurnRef.current.length >= 4 && Math.abs(currentTurn - baselineTurn) > 0.1) {
            await handleSuccess()
          }
        } catch (error) {
          stopCamera()
          setPhase('failed')
          setStatusText(error instanceof Error ? error.message : '活体检测失败，请稍后重试。')
        } finally {
          processingRef.current = false
        }
      }, 220)
    },
    [handleSuccess, stopCamera],
  )

  const startVerification = useCallback(async () => {
    stopCamera()
    setPhase('preparing')
    setStatusText('请正对摄像头，保持光线充足。正在启动相机和活体模型...')
    setCountdown(3)

    try {
      getProfilePayload()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (!videoRef.current) {
        throw new Error('相机预览初始化失败，请重试。')
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      const nextAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
      setAction(nextAction)
      setPhase('scanning')
      setStatusText(nextAction.hint)
      await beginDetection(nextAction)
    } catch (error) {
      stopCamera()
      setPhase('failed')
      setStatusText(error instanceof Error ? error.message : '无法启动活体认证，请稍后重试。')
    }
  }, [beginDetection, getProfilePayload, stopCamera])

  return (
    <section
      className={`rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,_rgba(240,249,255,0.95)_0%,_rgba(255,255,255,0.96)_100%)] p-5 shadow-[0_16px_40px_rgba(14,165,233,0.08)] ${
        compact ? '' : 'mt-6'
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-600">
            <ShieldCheck className="h-4 w-4" />
            {title}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-slate-900">
            完成动作识别后，系统会把你的 `profiles.is_verified` 更新为 `true`
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            页面会调用摄像头，并在圆形取景框中实时检测人脸动作。认证通过后，昵称后会永久显示官方蓝底白勾，未认证用户每天只能发送有限次数的喜欢。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-white px-3 py-1.5">请正对摄像头，保持光线充足</span>
            <span className="rounded-full bg-white px-3 py-1.5">随机动作识别</span>
            {(isVerified || phase === 'verified') && <VerifiedBadge label="真人认证" />}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
            {phase === 'scanning' || phase === 'preparing' || phase === 'saving' ? (
              <>
                <video ref={videoRef} muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
                <div className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-sky-300/70" />
              </>
            ) : phase === 'verified' || isVerified ? (
              <div className="flex flex-col items-center gap-3 text-center text-white">
                <CheckCircle2 className="h-14 w-14 text-sky-300" />
                <p className="text-sm font-medium">真人认证通过</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center text-white">
                <ScanFace className="h-12 w-12 text-sky-300" />
                <p className="px-6 text-sm leading-6 text-slate-200">圆形预览框会在点击“去认证”后开启</p>
              </div>
            )}

            {phase === 'scanning' && action && (
              <div className="absolute bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {action.title} · {countdown}s
              </div>
            )}
          </div>

          <div className="space-y-2 text-center">
            {statusText && <p className="max-w-xs text-sm leading-7 text-slate-600">{statusText}</p>}
            {errorMessage && <p className="max-w-xs text-sm leading-7 text-rose-500">{errorMessage}</p>}
          </div>

          <button
            type="button"
            onClick={() => void startVerification()}
            disabled={phase === 'preparing' || phase === 'scanning' || phase === 'saving'}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-5 py-3 text-sm font-medium text-white shadow-[0_16px_32px_rgba(59,130,246,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {phase === 'preparing' || phase === 'scanning' || phase === 'saving' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : phase === 'verified' || isVerified ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {phase === 'verified' || isVerified ? '重新认证' : '去认证'}
          </button>
        </div>
      </div>
    </section>
  )
}
