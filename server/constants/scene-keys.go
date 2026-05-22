package constants

type SceneKey string

const (
	SceneKeyGameFallingApples   SceneKey = "GameFallingApples"
	SceneKeyGameFloatingIslands SceneKey = "GameFloatingIslands"
	SceneKeyGameHotPotato       SceneKey = "GameHotPotato"
	SceneKeyGameSpaceVegetables SceneKey = "GameSpaceVegetables"
	SceneKeyGameStarWars        SceneKey = "GameStarWars"
)

var GameKeyMap = map[string]SceneKey{
	"0": SceneKeyGameFallingApples,
	"1": SceneKeyGameFloatingIslands,
	"2": SceneKeyGameHotPotato,
	"3": SceneKeyGameSpaceVegetables,
	"4": SceneKeyGameStarWars,
}
