module.exports = {
    defaultOption: 'classic',
    options: {
        'classic': {
            "name": "Classic",
            "url": "http://{S}tiles.mapbox.com/v3/timrobertson100.map-x2mlizjd/{Z}/{X}/{Y}.png",
            "attribution": "Mapbox, <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
            "png-render-style": "palette=yellows_reds",
            "subdomains": ['a.', 'b.', 'c.'],
            "enabled": true
        },
        'dark': {
            "name": "Night",
            "url": "http://{S}tiles.mapbox.com/v3/timrobertson100.map-c9rscfra/{Z}/{X}/{Y}.png",
            "attribution": "Mapbox, <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
            "png-render-style": "saturation=true",
            "subdomains": ['a.', 'b.', 'c.'],
            "enabled": false
        },
        'ocean': {
            "name": "Terrain",
            "url": "http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{Z}/{Y}/{X}.png",
            "attribution": "Esri, DeLorme, FAO, USGS, NOAA, GEBCO, IHO-IOC GEBCO, NGS, NIWA",
            "png-render-style": "palette=yellows_reds",
            "subdomains": [],
            "enabled": false
        },
        'satellite': {
            "name": "Satellite",
            "url": "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}.png",
            "attribution": "Esri, DeLorme, FAO, NOAA, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community",
            "png-render-style": "palette=yellows_reds",
            "subdomains": [],
            "enabled": false
        },
        'light': {
            "name": "High contrast",
            "url": "http://{S}tiles.mapbox.com/v3/timrobertson100.map-s9fg80cf/{Z}/{X}/{Y}.png",
            "attribution": "Mapbox, <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap contributors</a>",
            "png-render-style": "colors=%2C%2C%23CC0000FF",
            "subdomains": ['a.', 'b.', 'c.'],
            "enabled": false
        },
        'grey-blue': {
            "name": "Roads",
            "url": "http://2.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day.grey/{Z}/{X}/{Y}/256/png8?app_id=_peU-uCkp-j8ovkzFGNU&app_code=gBoUkAMoxoqIWfxWA5DuMQ",
            "attribution": "Nokia",
            "png-render-style": "palette=yellows_reds",
            "subdomains": [],
            "enabled": false
        }
    }
};
