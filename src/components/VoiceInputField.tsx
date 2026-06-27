/**
 * Shared voice-or-type input.
 * ----------------------------------------------------------------------------
 * Promoted from `enterprise-discovery/` to a neutral path so any flow
 * (Discovery, DUCE, Engagement tools) can capture dictated notes. The
 * implementation gracefully degrades to a plain textarea when the browser
 * has no Speech Recognition support.
 *
 * NOTE: the implementation still physically lives under enterprise-discovery
 * for now; this re-export makes it reusable without a risky file move. It can
 * be physically relocated later (git mv) with a build/test safety net.
 */
export { VoiceInputField } from '@/components/enterprise-discovery/VoiceInputField'
