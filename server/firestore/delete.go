package firestore

import (
	"errors"
)

// DeleteDocument deletes the targeted document with specified paths /{collectionID}/{documentID}
func DeleteDocument(collectionID string, documentID string) (err error) {
	if documentID == "" {
		return errors.New("empty document id")
	}

	client, ctx, err := getClient()
	if err != nil {
		return err
	}

	_, err = client.Collection(collectionID).Doc(documentID).Delete(ctx)
	return err
}
