package constants

type SceneKey string

const (
	SceneKeyGameFallingApples   SceneKey = "GameFallingApples"
	SceneKeyGameSpaceVegetables SceneKey = "GameSpaceVegetables"
	SceneKeyLobby               SceneKey = "Lobby"
	SceneKeyPreGame             SceneKey = "PreGame"
)

var GameKeyMap = map[string]SceneKey{
	"0": SceneKeyGameFallingApples,
	"1": SceneKeyGameSpaceVegetables,
}
