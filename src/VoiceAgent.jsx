import React, { useRef, useState, useEffect } from "react";

const userAvatar = (
    <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "#1976d2", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: "bold", fontSize: 18
    }}>U</div>
);

const agentAvatar = (
    <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "#e3f2fd", color: "#1976d2",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: "bold", fontSize: 18
    }}>A</div>
);

const micSvg = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#1976d2"/>
        <path d="M12 17a3 3 0 0 0 3-3v-4a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3zm5-3a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0c0 3.07 2.13 5.64 5 6.32V21a1 1 0 1 0 2 0v-1.68c2.87-.68 5-3.25 5-6.32z" fill="#fff"/>
    </svg>
);

function VoiceAgent() {
    const [recording, setRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [chat, setChat] = useState([]);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chat]);

    const startRecording = async () => {
        setRecording(true);
        audioChunksRef.current = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new window.MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            setLoading(true);
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const userAudioUrl = URL.createObjectURL(audioBlob);

            setChat((prev) => [...prev, { role: "user", audioUrl: userAudioUrl }]);

            const formData = new FormData();
            formData.append("audio", audioBlob, "input.webm");
            formData.append("callerId", "web-customer");

            const response = await fetch("https://voice-agent-smbo0w.fly.dev/call", {
                method: "POST",
                body: formData,
            });

            const replyBlob = await response.blob();
            const replyUrl = URL.createObjectURL(replyBlob);

            setChat((prev) => [...prev, { role: "agent", audioUrl: replyUrl }]);
            setLoading(false);
        };

        mediaRecorder.start();
    };

    const stopRecording = () => {
        setRecording(false);
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
    };

    return (
        <div style={{
            maxWidth: 420,
            margin: "60px auto",
            background: "#f7f9fa",
            borderRadius: 20,
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch"
        }}>
            <div style={{
                background: "#1976d2",
                color: "#fff",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: "18px 0",
                textAlign: "center",
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 1
            }}>
                Insurance Voice Agent
            </div>
            <div style={{
                flex: 1,
                maxHeight: 340,
                overflowY: "auto",
                padding: "18px 16px 0 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10
            }}>
                {chat.map((msg, idx) => (
                    <div key={idx} style={{
                        display: "flex",
                        flexDirection: msg.role === "user" ? "row-reverse" : "row",
                        alignItems: "flex-end",
                        gap: 10
                    }}>
                        {msg.role === "user" ? userAvatar : agentAvatar}
                        <div style={{
                            background: msg.role === "user" ? "#1976d2" : "#e3f2fd",
                            color: msg.role === "user" ? "#fff" : "#1976d2",
                            borderRadius: 16,
                            padding: "10px 16px",
                            maxWidth: 220,
                            boxShadow: "0 2px 8px rgba(25,118,210,0.08)",
                            display: "flex",
                            alignItems: "center"
                        }}>
                            <audio src={msg.audioUrl} controls style={{ marginLeft: 4, verticalAlign: "middle" }} />
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "18px 0", textAlign: "center", position: "relative" }}>
                <button
                    onClick={recording ? stopRecording : startRecording}
                    onTouchStart={recording ? stopRecording : startRecording}
                    disabled={loading}
                    style={{
                        background: recording ? "#1565c0" : "#1976d2",
                        border: "none",
                        borderRadius: "50%",
                        width: 56,
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        boxShadow: recording ? "0 0 0 4px #90caf9" : "0 2px 8px rgba(25,118,210,0.15)",
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "box-shadow 0.2s"
                    }}
                    aria-label={recording ? "Stop recording" : "Start recording"}
                >
                    {micSvg}
                </button>
                {loading && <p style={{ color: "#1976d2", marginTop: 10 }}>Processing...</p>}
            </div>
        </div>
    );
}

export default VoiceAgent;
