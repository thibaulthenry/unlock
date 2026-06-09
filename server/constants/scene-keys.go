package constants

type SceneKey string

const (
	SceneKeyGameBrawl           SceneKey = "GameBrawl"
	SceneKeyGameFallingApples   SceneKey = "GameFallingApples"
	SceneKeyGameFloatingIslands SceneKey = "GameFloatingIslands"
	SceneKeyGameHotPotato       SceneKey = "GameHotPotato"
	SceneKeyGameSpaceVegetables SceneKey = "GameSpaceVegetables"
	SceneKeyGameStarWars        SceneKey = "GameStarWars"
)

var GameKeyMap = map[string]SceneKey{
	"0": SceneKeyGameBrawl,
	"1": SceneKeyGameFallingApples,
	"2": SceneKeyGameFloatingIslands,
	"3": SceneKeyGameHotPotato,
	"4": SceneKeyGameSpaceVegetables,
	"5": SceneKeyGameStarWars,
}
