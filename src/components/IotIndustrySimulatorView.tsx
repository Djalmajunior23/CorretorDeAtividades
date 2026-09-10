import React, { useState } from "react";
import {
  Cpu,
  Radio,
  Zap,
  Activity,
  Play,
  RotateCcw,
  FileDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Terminal,
  Gauge
} from "lucide-react";
import { toast } from "sonner";
import {
  IotSimulationReport,
  MicrocontrollerType,
  IotIndustrySimulatorService
} from "../services/iotIndustrySimulatorService";

const SAMPLE_ESP32_FIRMWARE = `// Firmware Industrial ESP32 para Controle Térmico & MQTT
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define DHTPIN 21
#define DHTTYPE DHT22
#define RELAY_PIN 18
#define ALARM_PIN 2

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(ALARM_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
}

void loop() {
  float temp = dht.readTemperature();
  
  // Controle em Malha Fechada Proporcional
  if (temp > 30.0) {
    digitalWrite(RELAY_PIN, HIGH); // Liga sistema de refrigeração
    client.publish("senai/industry/actuators/relay", "{\\"relay\\": \\"ON\\"}");
  } else {
    digitalWrite(RELAY_PIN, LOW);
  }

  // Interlock de Segurança Crítico
  if (temp > 50.0) {
    digitalWrite(ALARM_PIN, HIGH); // Dispara alarme
  }

  delay(1000);
}`;

export const IotIndustrySimulatorView: React.FC = () => {
  const [microcontroller, setMicrocontroller] = useState<MicrocontrollerType>("ESP32_WIFI");
  const [firmwareLanguage, setFirmwareLanguage] = useState<"cpp" | "micropython" | "ladder">("cpp");
  const [ambientTemperature, setAmbientTemperature] = useState(36.5);
  const [code, setCode] = useState(SAMPLE_ESP32_FIRMWARE);

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<IotSimulationReport | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleSimulateHardware = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/iot-industry/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          microcontroller,
          firmwareLanguage,
          code,
          ambientTemperature
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
          toast.success("Simulação de Hardware & MQTT concluída com sucesso!");
          return;
        }
      }

      const fallback = await IotIndustrySimulatorService.simulateHardware({
        microcontroller,
        firmwareLanguage,
        code,
        ambientTemperature
      });
      setReport(fallback);
      toast.success("Simulação de Hardware concluída localmente!");
    } catch (err: any) {
      const fallback = await IotIndustrySimulatorService.simulateHardware({
        microcontroller,
        firmwareLanguage,
        code,
        ambientTemperature
      });
      setReport(fallback);
      toast.success("Simulação de Hardware concluída com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/iot-industry/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await IotIndustrySimulatorService.generateIotReportPdf(report);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_iot_${report.simulationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Laudo Indústria 4.0 IoT baixado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" /> Industry 4.0 & IoT Lab
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Hardware-in-the-Loop & MQTT Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Industry 4.0 & IoT Virtual Hardware-in-the-Loop Simulator
          </h1>
          <p className="text-slate-400 text-sm">
            Emulação de microcontroladores industriais (ESP32/PLC), sensores térmicos/ultrassônicos, acionamento de relés e telemetria MQTT.
          </p>
        </div>

        {report && (
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExportingPdf ? "Gerando Laudo..." : "Exportar Laudo IoT (PDF)"}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hardware Workbench & Code */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Bancada Virtual de Embarcados
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target / Microcontrolador</label>
                <select
                  value={microcontroller}
                  onChange={(e) => setMicrocontroller(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ESP32_WIFI">ESP32 Dual Core Wi-Fi/BLE</option>
                  <option value="ARDUINO_UNO">Arduino Uno R3 (ATmega328P)</option>
                  <option value="PLC_SIEMENS_S7">PLC Siemens S7-1200</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Linguagem do Firmware</label>
                <select
                  value={firmwareLanguage}
                  onChange={(e) => setFirmwareLanguage(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="cpp">C++ (Arduino / ESP-IDF)</option>
                  <option value="micropython">MicroPython</option>
                  <option value="ladder">Ladder Logic (IEC 61131-3)</option>
                </select>
              </div>
            </div>

            {/* Environmental Condition Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Temperatura Ambiente do Forno Industrial:</span>
                <span className="font-bold text-emerald-400 font-mono">{ambientTemperature.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min={15}
                max={65}
                step={0.5}
                value={ambientTemperature}
                onChange={(e) => setAmbientTemperature(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Código do Firmware</label>
                <button
                  type="button"
                  onClick={() => setCode(SAMPLE_ESP32_FIRMWARE)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Restaurar Firmware
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={11}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleSimulateHardware}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Emulando Ciclos de Clock & Telemetria MQTT...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Disparar Hardware-in-the-Loop & MQTT
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Simulation Telemetry */}
        <div className="lg:col-span-6 space-y-4">
          {!report && !isLoading && (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <Cpu className="w-14 h-14 text-emerald-400/40 mb-3" />
              <h3 className="text-base font-semibold text-slate-200 mb-1">Bancada Virtual Pronta</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Ajuste a temperatura e execute o firmware para validar o acionamento em malha fechada e interlocks de segurança.
              </p>
            </div>
          )}

          {report && (
            <div className="space-y-4">
              {/* Scorecard */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Eficiência de Controle</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    {report.closedLoopEfficiencyScore}/100
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Interlock de Segurança</span>
                  <div className="text-sm font-bold text-cyan-300 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {report.safetyInterlockPassed ? "APROVADO (SEGURO)" : "RISCO DETECTADO"}
                  </div>
                </div>
              </div>

              {/* Physical Actuators State */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" /> Atuadores & Pinos Físicos do Microcontrolador
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {report.actuators.map((a) => (
                    <div key={a.pin} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                      <div className="text-slate-400 font-mono text-[10px]">{a.pin}</div>
                      <div className="font-bold text-slate-200">{a.actuatorType}</div>
                      <div className={`text-xs font-bold ${a.state === "ON" ? "text-emerald-400" : "text-slate-500"}`}>
                        Estado: {a.state} (Valor: {a.value})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MQTT Broker Stream Feed */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" /> Stream de Mensagens MQTT em Tempo Real
                </h3>
                <div className="space-y-2">
                  {report.mqttTelemetryStream.map((msg, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
                      <span>[{msg.topic}]</span>
                      <span className="text-slate-400">{msg.payload}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IotIndustrySimulatorView;
