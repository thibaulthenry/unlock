package firestore

import (
	firestore "cloud.google.com/go/firestore"
	"context"
	"github.com/pkg/errors"
)

var firestoreClient *firestore.Client

// getClient returns an instance of firestore client stored in the singleton firestoreClient
// According to the firestore documentation, the client does not need to be closed before program exit
func getClient() (client *firestore.Client, ctx context.Context, err error) {
	ctx = context.Background()
	if firestoreClient != nil {
		return firestoreClient, ctx, nil
	}

	firestoreClient, err = firestore.NewClient(ctx, "unlock-db")
	if err != nil {
		return nil, ctx, errors.WithStack(err)
	}

	return firestoreClient, ctx, nil
}