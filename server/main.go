package main

import (
	"flag"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"
	"unlock/models"
)

var defaultAllowedOrigins = []string{
	"https://unlock-db.web.app",
	"https://unlock-db.firebaseapp.com",
}

func loadAllowedOrigins() map[string]struct{} {
	raw := os.Getenv("ALLOWED_ORIGINS")
	var origins []string
	if raw == "" {
		origins = defaultAllowedOrigins
	} else {
		origins = strings.Split(raw, ",")
	}

	allowed := make(map[string]struct{}, len(origins)*2)
	for _, o := range origins {
		o = strings.TrimSpace(o)
		if o == "" {
			continue
		}
		allowed[strings.TrimSuffix(o, "/")] = struct{}{}
		allowed[strings.TrimSuffix(o, "/")+"/"] = struct{}{}
	}
	return allowed
}

func serveWebSocket(lobbyRepository *models.LobbyRepository, upgrader websocket.Upgrader, allowedOrigins map[string]struct{}, w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		_, ok := allowedOrigins[r.Header.Get("Origin")]
		return ok
	}

	connection, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := models.NewClient(connection, lobbyRepository)

	go client.ReadPump()
	go client.WritePump()
}

func main() {
	lobbyRepository := models.NewLobbyRepository()
	allowedOrigins := loadAllowedOrigins()

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		serveWebSocket(lobbyRepository, upgrader, allowedOrigins, writer, request)
	})

	go func() {
		for range time.Tick(10 * time.Second) {
			log.Println("Number of goroutine running: ", runtime.NumGoroutine())
		}
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	url := flag.String("addr", ":"+port, "http service address")

	err := http.ListenAndServe(*url, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
