package models

import (
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"log"
	"time"
	"unlock/constants"
)

type Client struct {
	Channel         chan []byte           `json:"-"  firestore:"-"`
	Connection      *websocket.Conn       `json:"-" firestore:"-"`
	Lobby           *Lobby                `json:"-" firestore:"-"`
	LobbyRepository *LobbyRepository      `json:"-" firestore:"-"`
	Name            string                `json:"name" firestore:"name"`
	Points          int                   `json:"points" firestore:"points"`
	Spectating      bool                  `json:"spectating" firestore:"spectating"`
	SpriteColor     constants.SpriteColor `json:"spriteColor" firestore:"spriteColor"`
	Uuid            string                `json:"uuid" firestore:"uuid"`
}

func NewClient(connection *websocket.Conn, lobbyRepository *LobbyRepository) *Client {
	return &Client{
		Channel:         make(chan []byte, 256),
		Connection:      connection,
		LobbyRepository: lobbyRepository,
		Spectating:      false,
		Uuid:            uuid.NewString(),
	}
}

func (client *Client) initConnection() (err error) {
	client.Connection.SetReadLimit(constants.ParametersMaxMessageSize)

	err = client.Connection.SetReadDeadline(time.Now().Add(constants.ParametersPongWait))
	if err != nil {
		return err
	}

	client.Connection.SetPongHandler(func(string) error {
		return client.Connection.SetReadDeadline(time.Now().Add(constants.ParametersPongWait))
	})

	return nil
}

func (client *Client) quit() (err error) {
	lobby := client.Lobby

	err = client.Connection.Close()
	if err != nil || lobby == nil {
		return err
	}

	lobby.UnregisterWaitGroup.Add(1)
	lobby.Unregister <- client
	lobby.UnregisterWaitGroup.Wait()

	if len(lobby.Clients) == 0 {
		lobby.Interrupt <- true
		delete(client.LobbyRepository.lobbies, lobby.Code)
		return lobby.deleteInFirestore()
	}

	if lobby.State > constants.LobbyStatePending && len(lobby.Clients) == 1 {
		err = NewPacketServerLobbyInterrupt().Send(lobby)
		if err != nil {
			return err
		}
	}

	return lobby.PushToFirestore()
}

func (client *Client) ReadPump() {
	err := client.initConnection()
	if err != nil {
		log.Println(err)
	}

	defer func() {
		err := client.quit()
		if err != nil {
			log.Println(err)
		}
	}()

	for {
		_, payload, err := client.Connection.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println(err)
			}
			break
		}

		err = HandlePacket(client, payload)
		if err != nil {
			log.Println(err)
		}
	}
}

func (client *Client) WritePump() {
	ticker := time.NewTicker(constants.ParametersPingPeriod)

	defer func() {
		ticker.Stop()

		err := client.Connection.Close()
		if err != nil {
			log.Println(err)
		}
	}()

	for {
		select {

		case payload, ok := <-client.Channel:
			err := client.Connection.SetWriteDeadline(time.Now().Add(constants.ParametersWriteWait))
			if err != nil {
				log.Println(err)
			}

			if !ok {
				err := client.Connection.WriteMessage(websocket.CloseMessage, []byte{})
				if err != nil {
					log.Println(err)
				}

				return
			}

			writer, err := client.Connection.NextWriter(websocket.TextMessage)
			if err != nil {
				log.Println(err)
				return
			}

			_, err = writer.Write(payload)
			if err != nil {
				log.Println(err)
			}

			err = writer.Close()
			if err != nil {
				log.Println(err)
				return
			}

		case <-ticker.C:
			err := client.Connection.SetWriteDeadline(time.Now().Add(constants.ParametersWriteWait))
			if err != nil {
				log.Println(err)
			}

			err = client.Connection.WriteMessage(websocket.PingMessage, nil)
			if err != nil {
				log.Println(err)
				return
			}
		}
	}
}
