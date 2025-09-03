## 🚀 Cómo correr el proyecto con Docker

```bash
# Construir la imagen (usar --no-cache si tienes problemas con dependencias)
docker compose build --no-cache
docker compose up
```


Disponible en: http://localhost:3000

## 📦 Dependencias de Node.js

Dependencias principales instaladas con npm:

express → framework para el servidor web

mongoose → ODM para MongoDB

body-parser → parseo de requests

ejs → motor de plantillas

method-override → soporte para PUT/DELETE en formularios

redis → cliente de Redis para caching

## 🗂️ Modelos creados

models/Author.js → name, dateOfBirth, countryOfOrigin, shortDescription

models/Book.js → name, summary, dateOfPublication, numberOfSales, author

models/Review.js → book, review, score, upvotes

models/Sales.js → book, year, sales