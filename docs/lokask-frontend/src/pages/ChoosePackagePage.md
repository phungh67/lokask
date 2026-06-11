```json
[
  {
    "id": "package-selection",
    "component": "Card",
    "props": {
      "title": "Find Your Perfect Guide Experience",
      "description": "Select a package that fits your interests and budget. Each package offers unique insights into local culture and hidden gems.",
      "children": [
        {
          "type": "CardGroup",
          "props": {
            "columns": 3,
            "children": [
              {
                "type": "Card",
                "props": {
                  "title": "Cultural Immersion",
                  "description": "Dive deep into local traditions, markets, and daily life with expert local guides.",
                  "price": "$75",
                  "button_text": "View Details",
                  "action": "handlePackageSelect('cultural')"
                }
              },
              {
                "type": "Card",
                "props": {
                  "title": "Adventure Seeker",
                  "description": "Explore offbeat trails, adventurous hikes, and thrilling outdoor activities.",
                  "price": "$90",
                  "button_text": "View Details",
                  "action": "handlePackageSelect('adventure')"
                }
              },
              {
                "type": "Card",
                "props": {
                  "title": "Foodie Journey",
                  "description": "Taste the best street food, visit local kitchens, and take a culinary tour.",
                  "price": "$65",
                  "button_text": "View Details",
                  "action": "handlePackageSelect('foodie')"
                }
              }
            ]
          }
        }
      ]
    },
    "style": "p-6 bg-gray-50 shadow-inner my-8 rounded-xl"
  }
]
```