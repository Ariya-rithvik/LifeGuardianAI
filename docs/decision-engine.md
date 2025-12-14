# Decision Engine (AI Brain)

The LifeGuardianAI decision engine is a finite-state system that determines
how the AI responds to detected safety events.

## States

1. NORMAL  
   - No danger detected
   - Passive monitoring only

2. ALERT (Tier 1 – Low Risk)
   - Medium-confidence event detected
   - System asks the user verbally if they are okay

3. WARNING (Tier 2 – Medium Risk)
   - No response to ALERT
   - Louder voice + visual cues
   - Requests verbal, gesture, or movement confirmation

4. EMERGENCY (Tier 3 – High Risk)
   - High-confidence danger OR no response to previous tiers
   - Emergency contacts notified
   - Emergency services called if needed

## State Transitions

NORMAL → ALERT  
- Fall detected (60–80% confidence)  
- No movement for 3–5 minutes  
- Chest pain indicators detected  

ALERT → NORMAL  
- User responds verbally or by gesture  

ALERT → WARNING  
- No response within 30–45 seconds  

WARNING → NORMAL  
- User responds or moves  

WARNING → EMERGENCY  
- No response within additional 45 seconds  
- Fall confidence > 85%  
- Chest pain + distress signals  

EMERGENCY → RESOLVED  
- Emergency contact confirms safety  
- Manual override by user or caregiver
