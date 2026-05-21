package constants

type SceneKey string

const (
	SceneKeyGameFallingApples   SceneKey = "GameFallingApples"
	SceneKeyGameFloatingIslands SceneKey = "GameFloatingIslands"
	SceneKeyGameSpaceVegetables SceneKey = "GameSpaceVegetables"
	SceneKeyGameStarWars        SceneKey = "GameStarWars"
)

var GameKeyMap = map[string]SceneKey{
	"0": SceneKeyGameFallingApples,
	"1": SceneKeyGameFloatingIslands,
	"2": SceneKeyGameSpaceVegetables,
	"3": SceneKeyGameStarWars,
}
