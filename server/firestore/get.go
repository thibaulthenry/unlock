package firestore

import "github.com/pkg/errors"

// GetDocument gets the document which path is /{collectionID}/{documentID} in the project's firestore and
// put every fields into the target interface
func GetDocument(collectionID string, documentID string, documentTarget interface{}) (err error) {
	if documentID == "" {
		return errors.New("empty document id")
	}

	client, ctx, err := getClient()
	if err != nil {
		return err
	}

	snapshot, err := client.Collection(collectionID).Doc(documentID).Get(ctx)
	if err != nil {
		return errors.WithStack(err)
	}

	return errors.WithStack(snapshot.DataTo(documentTarget))
}
