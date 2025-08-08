import React, { useState } from 'react'

export default function LoginComponent() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim() === 'salud') setStatus('ok')
    else setStatus('error')
  }

  return (
    <form role="form" onSubmit={onSubmit}>
      <label htmlFor="code-input">Código</label>
      <input
        id="code-input"
        aria-label="Código"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Ingresa el código"
      />
      <button type="submit">Acceder</button>

      {status === 'ok' && <p>Acceso permitido</p>}
      {status === 'error' && <p>Código incorrecto</p>}
    </form>
  )
}


