package firestore

import (
	"github.com/pkg/errors"
)

// SetDocument sets (creates or overwrites) a document at /{collectionID}/{documentID} on the project's firestore
// with the specified document
func SetDocument(collectionID string, documentID string, document interface{}) (err error) {
	if documentID == "" {
		return errors.New("empty document id")
	}

	client, ctx, err := getClient()
	if err != nil {
		return err
	}

	_, err = client.Collection(collectionID).Doc(documentID).Set(ctx, document)
	return errors.WithStack(err)
}
