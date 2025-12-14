<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JLQbtCL9zPCrcd_f3y3c3MnVqTXS71h0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



🛡️ LifeGuardianAI

LifeGuardianAI is an AI-powered safety and assistance system designed to protect elderly people living alone and children left at home, by continuously monitoring for dangerous situations and responding intelligently, calmly, and proactively.

🚨 Problem Statement

Many elders live alone without immediate help during emergencies such as falls, chest pain, or sudden immobility.
Similarly, children may be left unsupervised while parents work, increasing the risk of accidents involving dangerous objects.

Existing solutions are often:

Reactive instead of preventive

Expensive or hardware-dependent

Emotionless and difficult to interact with

💡 Solution Overview

LifeGuardianAI acts as a digital guardian that can:

Observe through a camera

Detect potentially dangerous situations

Reason about risk levels

Interact with humans using calm voice prompts

Escalate intelligently when no response is received

The system is designed to think before acting, avoiding unnecessary panic while ensuring safety.

🧠 How the System Works (High Level)

Detection

Potential events such as falls, no movement, chest pain indicators, or a child holding a dangerous object are identified.

Decision Engine

A tier-based decision system evaluates risk:

NORMAL → ALERT → WARNING → EMERGENCY

Human Interaction

The AI speaks calmly to confirm safety.

Volume and urgency increase only if there is no response.

Escalation

Emergency contacts are notified.

Emergency services can be contacted if required.

This design prioritizes human-like reasoning over blind automation.

🤖 AI Stack
🔹 Google AI Studio (Gemini)

Used as the multimodal AI execution layer:

Vision understanding (posture, movement, objects)

Multimodal reasoning

Language understanding and response generation

🔹 Cline

Used as an AI system architect and reasoning assistant:

Designing system architecture

Defining safety tiers and escalation logic

Validating edge cases and false positives

Preparing documentation and demo scenarios

Cline was used in Plan Mode to reason about how the AI should think and act, while the runtime logic is implemented separately.

🧩 System Architecture

The system is designed with a clean separation of concerns:

Perception Layer – Detects events (vision/audio)

Event Interface – Converts detections into structured events

Decision Engine – Determines risk level and next action

Interaction Layer – Voice-based human interaction

Escalation Layer – Alerts family or emergency services

This modular design allows easy future integration with real-time sensors and external services.

🎭 Demo Scenarios
1️⃣ Elder Fall Scenario

A fall is detected with high confidence

AI calmly asks if the person is okay

No response → escalation through warning and emergency tiers

Emergency contacts are notified

2️⃣ Child Safety Scenario

A knife-like object is detected

AI gently instructs the child to put it down

Parents are notified immediately

Demo scripts are available in the /demo folder.

🧪 Current Status

Core architecture and reasoning logic designed

Event-based decision flow validated

Demo-ready scenarios prepared

Future-ready for real-time integration

🚀 Future Work

Real-time camera and audio streaming

Direct emergency service integration

Wearable device support

Multi-language voice interaction

Mobile companion app for caregivers

❤️ Why This Matters

LifeGuardianAI is not just about detecting danger —
it’s about responding with empathy, intelligence, and responsibility.

By combining AI reasoning with human-centered design, LifeGuardianAI aims to make homes safer, calmer, and more connected.

📌 Hackathon Note

This project emphasizes AI reasoning, safety design, and real-world impact over raw automation, demonstrating how AI systems can act responsibly in sensitive human environments.
<img width="1054" height="928" alt="image" src="https://github.com/user-attachments/assets/7fc69d86-8aba-47eb-a342-f2b424e1a32b" />

<img width="899" height="638" alt="image" src="https://github.com/user-attachments/assets/f3055425-5453-4292-80a9-1702e147cb9e" />
used cline :
<img width="1919" height="906" alt="image" src="https://github.com/user-attachments/assets/8c3bc441-1397-4ad8-9251-6ae741de5500" />
<img width="1914" height="907" alt="image" src="https://github.com/user-attachments/assets/4fe8c79d-ae6a-41ca-90fd-78e3c5356080" />
<img width="1919" height="952" alt="image" src="https://github.com/user-attachments/assets/fb59d136-bee7-4da9-a46e-bc43b320e8d2" />




