# Pages wiki

Les fichiers de ce dossier sont prêts à être collés tels quels dans le
[wiki GitHub du repo](https://github.com/thibaulthenry/unlock/wiki).

GitHub Wiki stocke chaque page dans un fichier `Title.md` à la racine du
sous-repo `<repo>.wiki.git`. Pour synchroniser :

```bash
# Cloner le wiki (séparé du repo principal)
git clone https://github.com/thibaulthenry/unlock.wiki.git

# Copier les pages
cp docs/wiki/*.md ../unlock.wiki/

# Push
cd ../unlock.wiki
git add . && git commit -m "Sync wiki from docs/wiki" && git push
```

## Pages disponibles

| Fichier                       | Titre wiki                |
| ----------------------------- | ------------------------- |
| `Home.md`                     | Home                      |
| `How-to-play.md`              | How to play               |
| `Mini-games.md`               | Mini-games                |
| `Local-development.md`        | Local development         |
| `Architecture.md`             | Architecture              |
| `Packets.md`                  | Packets                   |
| `Cloud-deployment.md`         | Cloud deployment          |
| `Environment-variables.md`    | Environment variables     |

> Les chemins relatifs vers les screenshots (`../screenshots/...`) ne
> fonctionnent que dans le repo ; sur le wiki GitHub, il faudra
> uploader les images dans la page wiki ou pointer vers la version raw
> du repo : `https://raw.githubusercontent.com/thibaulthenry/unlock/main/docs/screenshots/01-home.png`.
