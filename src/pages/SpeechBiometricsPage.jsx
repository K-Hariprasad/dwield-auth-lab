import React from 'react';
import { Mic, AlertTriangle, Cpu, CheckCircle2, ShieldOff } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';

export function SpeechBiometricsPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Speech & Voice Biometrics Testing</h1>
        <p>SDK and Service Capability Assessment for Voice Recognition and Speaker Verification.</p>
      </div>

      {/* Integration Required Banner */}
      <div className="integration-required-box">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
        <h3>Feature Integration Required</h3>
        <p>
          Speech-based biometrics and speaker verification are <strong>not implemented</strong> in the current version of <code>@dwield/device-biometrics-sdk</code> (v1.3.7).
          <br />
          The SDK includes WebAudio API hardware frequency fingerprinting (via <code>audio_fingerprint.js</code>), but does not support voice audio recording or speaker identity verification.
        </p>
      </div>

      {/* Technical Distinction Matrix */}
      <Card title="Audio Capability Analysis & Architectural Matrix" icon={Cpu}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Capability / Feature</th>
                <th>Implementation Status</th>
                <th>Underlying Technology</th>
                <th>Dwield Integration Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>WebAudio API Hardware Fingerprinting</td>
                <td>
                  <StatusBadge status="ACTIVE" label="Implemented" />
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  OfflineAudioContext + Oscillator triangle 10kHz
                </td>
                <td>Device hardware identity signal in <code>getDeviceData()</code></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Voice Biometrics & Speaker Verification</td>
                <td>
                  <StatusBadge status="FAILED" label="Not Implemented" />
                </td>
                <td>Speech acoustic feature extraction & neural speaker ID</td>
                <td>Requires future SDK version & voice biometrics engine</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Browser Speech Recognition (STT)</td>
                <td>
                  <StatusBadge status="NEUTRAL" label="Not Security Grade" />
                </td>
                <td>Web Speech API (SpeechRecognition)</td>
                <td>Text transcribing only; not acceptable for voice authentication</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
