package firestore

import (
	"cloud.google.com/go/firestore"
	"context"
	"os"
)

const defaultProjectID = "unlock-db"

var firestoreClient *firestore.Client

// getClient returns an instance of firestore client stored in the singleton firestoreClient
// According to the firestore documentation, the client does not need to be closed before program exit
func getClient() (client *firestore.Client, ctx context.Context, err error) {
	ctx = context.Background()
	if firestoreClient != nil {
		return firestoreClient, ctx, nil
	}

	projectID := os.Getenv("GCP_PROJECT_ID")
	if projectID == "" {
		projectID = defaultProjectID
	}

	firestoreClient, err = firestore.NewClient(ctx, projectID)
	if err != nil {
		return nil, ctx, err
	}

	return firestoreClient, ctx, nil
}