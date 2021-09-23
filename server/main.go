package main

import (
	"flag"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"os"
	"runtime"
	"time"
	"unlock/models"
)

func serveWebSocket(lobbyRepository *models.LobbyRepository, upgrader websocket.Upgrader, w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// return origin == "https://unlock-db.web.app" || origin == "https://unlock-db.firebaseapp.com" || origin == "https://unlock-db.web.app/" || origin == "https://unlock-db.firebaseapp.com/"
		return origin == "http://localhost:3000" || origin == "http://localhost:5000" || origin == "http://192.168.1.15:3000" || origin == "http://192.168.1.17:5000" || origin == "http://192.168.43.157:3000"
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

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		serveWebSocket(lobbyRepository, upgrader, writer, request)
	})

	go func () {
		for {
			select {
			case <- time.Tick(10 * time.Second):
				log.Println("Number of goroutine running: ", runtime.NumGoroutine())
			}
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
