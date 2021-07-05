package constants

type SceneKey string

const (
	SceneKeyGameFallingApples   SceneKey = "GameFallingApples"
	SceneKeyGameSpaceVegetables SceneKey = "GameSpaceVegetables"
	SceneKeyGameStarWars        SceneKey = "GameStarWars"
)

var GameKeyMap = map[string]SceneKey{
	"0": SceneKeyGameFallingApples,
	"1": SceneKeyGameSpaceVegetables,
	"2": SceneKeyGameStarWars,
}
