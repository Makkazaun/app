import Script from 'next/script'

export default function SuperchatWidget() {
  return (
    <Script
      src="https://widget.superchat.de/snippet.js?applicationKey=WCaQ4yoZkP2rbzkorYb50GemWd"
      strategy="afterInteractive"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
