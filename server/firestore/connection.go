package firestore

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/pkg/errors"
	"google.golang.org/api/option"
)

var firestoreClient *firestore.Client

// getClient returns an instance of firestore client stored in the singleton firestoreClient
// According to the firestore documentation, the client does not need to be closed before program exit
func getClient() (client *firestore.Client, ctx context.Context, err error) {
	ctx = context.Background()
	if firestoreClient != nil {
		return firestoreClient, ctx, nil
	}

	// firestoreClient, err = firestore.NewClient(ctx, "unlock-db")
	// firestoreClient, err = firestore.NewClient(ctx, "unlock-db", option.WithCredentialsFile("C:\\Users\\thiba\\Documents\\Code\\Firebase\\unlock-db\\unlock-db-b9ef89031623.json"))
	firestoreClient, err = firestore.NewClient(ctx, "unlock-db", option.WithCredentialsFile("/Users/thibault/Documents/unlock-db-firebase-adminsdk-i59i8-031d3bdd9c.json"))
	if err != nil {
		return nil, ctx, errors.WithStack(err)
	}

	return firestoreClient, ctx, nil
}