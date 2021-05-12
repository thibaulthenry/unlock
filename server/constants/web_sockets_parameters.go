package constants

import "time"

const (
	// ParametersMaxMessageSize Maximum message size allowed from peer.
	ParametersMaxMessageSize = 512

	// ParametersPingPeriod Send pings to peer with this period. Must be less than pongWait.
	ParametersPingPeriod = (ParametersPongWait * 9) / 10

	// ParametersPongWait Time allowed to read the next pong message from the peer.
	ParametersPongWait = 60 * time.Second

	// ParametersWriteWait Time allowed to write a message to the peer.
	ParametersWriteWait = 10 * time.Second
)
