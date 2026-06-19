package constants

// Durées en millisecondes pour permettre la granularité fine nécessaire à
// certains mini-jeux (ex. Floating Islands : timeouts de 250-500 ms sur
// la stabilité des îles).
const (
	TimeoutDurationGameWait           int = 15000
	TimeoutDurationLobbyCollapse      int = 10000
	TimeoutDurationLobbyStart         int = 20000
	TimeoutDurationLobbyStartImminent int = 8000
)
