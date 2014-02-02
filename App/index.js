ejecta.include('functions.js')
ejecta.include('backend.js')
ejecta.include('images.js')
ejecta.include('sounds/sounds.js')

var ctx = canvas.getContext('2d')
var centerX = canvas.width / 2
var centerY = canvas.height / 2

var fps = 60
var debug = false // Can be toggled by tapping the screen in game mode

var currentScreen = 'menu'

var grid = new Array() // Keeps track of grid pixel and coordinate positions for use in other functions
var tileSize = 45
var gridWidth = 21 // Make sure the gridsize is always an odd number so there's a tile in the center to start the player in
var gridHeight = gridWidth

var tileSizeMeters = 10
var gpsRequiredAccuracy = 15 // Normally set to 15

var zombies = new Array() // Our local array of zombies
var ammo = new Array() // Locally monitor the objects placed throughout the world
var reeds = new Array() // Keep track of the reeds (plants) in the environment
var vision = new Array() // The things in our field of view
var melee = new Array() // The zombies close enough to be punched

// var renderDistance = 22 // ...in meters
var maxShotDistance = 5 // ...in meters
var minShotDistance = 0 // ...in meters
var damageDistance = 0 // ...in meters
var fieldOfView = 25 // ...in degrees

var totalZombies = 15
var totalAmmo = totalZombies / 3
var totalReeds = totalZombies * 3

var zombieMinHealth = 2
var zombieMaxHealth = 3
var zombieSlowest = 5000 // Longest time possible for zombies to move to a new square
var zombieFastest = 3000 // Shortest time possible for zombies to move to a new square

var slowestAnimation = 800 // The longest time possible between animation frames

// How much ammo can be in a pack
var ammoCountLow = 1
var ammoCountHigh = 3

// How much motion is required for certain actions
var rotateRequiredShoot = 400
var rotateRequiredReload = 500 // Set higher than needed to prevent accidental reloading
var accelRequiredMelee = 50

// Keep the sound effects in line by setting their "length"
var canShoot = true
var canShootServer = true
var timeFire = 300
var timeReload = 1100 // canShoot manages timeReload
var timeCock = 450
var canMelee = true
var timeMelee = 350

var meleeDamage = 10

// General player variables
var playerMaxHealth = 5
var player = new Object()
	player.column = Math.ceil(gridWidth / 2)
	player.row = Math.ceil(gridHeight / 2)
	player.health = playerMaxHealth
	player.history = new Array() // Keeps track of where the player's been on the grid
var canBeHurt = true
var timeHurt = 1000 // The amount of time between each damage "tick" when a zombie is close
var capacity = 6 // Since we have a revolver right now
var magazine = random(0, capacity - 4)
var extraAmmo = random(0, 2)
var shotDamage = 3 // How much damage a bullet deals (change this later to be more dynamic)

// Color scheme
var white = '#FFFFFF'
var green = '#3D9970'
var black = '#111111'
var blue = '#7FDBFF'
var navy = '#001F3F'
var red = '#FF4136'

// UI values
var canvasColor = green
var flashColor = red
var debugColor = blue

var darkestNight = 0.5 // The deepest night value possible

// Remove once I pixel out indicator images
var indicatorWidth = 15
var indicatorHeight = 7
var indicatorSpacing = 5

var menuGridWidth = 19 // Make sure the gridsize is always an odd number so there's a tile in the center to start the player in
var menuGridHeight = menuGridWidth
var menuRotation = 0
var menuRotationSpeed = 0.035
var menuTotalZombies = 35
var menuTotalReeds = menuTotalZombies * 2

var menuSize = canvas.width / 4.5
var menuSpacing = 3.5
var menuShadowOffset = 10

var xStats = centerX - menuSize / 2 - menuSpacing
var yStats = centerY - menuSize / 2 - menuSpacing - menuSize - menuSpacing * 2
var xSingle = centerX + menuSize / 2 + menuSpacing
var ySingle = centerY - menuSize / 2 - menuSpacing
var xMulti = centerX - menuSize / 2 - menuSpacing
var yMulti = centerY + menuSize / 2 + menuSpacing
var xSettings = centerX + menuSize / 2 + menuSpacing
var ySettings = centerY + menuSize / 2 + menuSpacing + menuSize + menuSpacing * 2

document.addEventListener('pagehide', function() // Close the connection to the server upon leaving the app
{
	// socket.close()
	gps.history.length = 0
	currentScreen = 'menu'
})

/*
document.addEventListener('pageshow', function() // Reconnect to the server upon resuming the app
{
	zombies.length = 0 // Wipe the zombie database and don't reopen the connection
})
*/

document.addEventListener('touchstart', function(ev) // Monitor touches throughout the game
{
	var x = ev.touches[0].pageX
	var y = ev.touches[0].pageY

	if (currentScreen == 'menu')
	{
		if (Math.abs(xSingle - x) * Math.abs(xSingle - x) + Math.abs(ySingle - y) * Math.abs(ySingle - y) < menuSize * menuSize)
		{
			musMenu.pause() // Kill the menu music before moving into the game screen
			zombies.length = 0 // Wipe the zombie database so we can start playing with "real" zombies
			currentScreen = 'game'
		}
		else if (Math.abs(xSettings - x) * Math.abs(xSettings - x) + Math.abs(ySettings - y) * Math.abs(ySettings - y) < menuSize * menuSize)
		{
			currentScreen = 'settings'
		}
	}
	else if (currentScreen == 'game')
	{
		// debug = !debug // Toggle debug mode for framerate increase
		/*
		if (player.row > 1 && player.row < gridHeight)
		{
			player.row -= 1
		}
		if (player.column > 1 && player.column < gridWidth)
		{
			player.column -= 1
		}
		*/

		if (gps.history.length == 0)
		{
			gps.history[0] = new Object()
			gps.history[0].latitude = gps.latitude
			gps.history[0].longitude = gps.longitude
		}

		if (y < canvas.height / 3)
		{
			gps.history[0].latitude -= 1
		}
		else if (y < canvas.height / 3 * 2)
		{
			if (x < canvas.width / 2)
			{
				gps.history[0].longitude -= 1
			}
			else
			{
				gps.history[0].longitude += 1
			}
		}
		else
		{
			gps.history[0].latitude += 1
		}
	}
	else if (currentScreen == 'settings')
	{
		if (x > 10 && x < imgBackArrow.width + 10 && y > 10 && y < imgBackArrow.height + 10)
		{
			currentScreen = 'menu'
		}

		if (x > canvas.width / 2 - imgBug.width / 2 && x < canvas.width / 2 + imgBug.width / 2 && y > 150 - imgBug.height / 2 && y < 150 + imgBug.height / 2)
		{
			debug = !debug
		}
	}
	else if (currentScreen == 'gameover')
	{
		zombies.length = 0 // Wipe the zombie database so we can start playing with "real" zombies
		ammo.length = 0 // Kill the ammo packs
		currentScreen = 'game'
	}
})

setInterval(function() // Main game loop
{
	if (currentScreen == 'menu')
	{
		if (zombies.length == 0) // If there are no zombies, then this is the first time through the menu code
		{
			musMenu.play()

			for (var i = 0; i < menuTotalReeds; i++)
			{
				var thingy = new Object()
				thingy.column = Math.floor(random(1, menuGridWidth))
				thingy.row = Math.floor(random(1, menuGridHeight))
				reeds.push(thingy)
			}
			
			for (var i = 0; i < menuTotalZombies; i++)
			{
				var thingy = new Object()
					thingy.name = 'zombie' + i
					thingy.column = Math.floor(random(1, menuGridWidth))
					thingy.row = Math.floor(random(1, menuGridHeight))
					thingy.health = random(zombieMinHealth, zombieMaxHealth)
					thingy.frame = random(0, 1)
					thingy.animate = animate(thingy, slowestAnimation)
				
				zombies.push(thingy)
			}
		}

		drawMenu()
	}
	else if (currentScreen == 'game')
	{
		if (gps.latitude && gps.longitude && gps.accuracy < gpsRequiredAccuracy) // Only do stuff if we know where we are
		{
			// ******************************
			// Run calculations
			// ******************************

			pickup()

			// Clear the various arrays on each pass so we get fresh results
			melee.length = 0
			vision.length = 0

			if (reeds.length == 0) // Spawn reeds if we have none currently
			{
				for (var i = 0; i < totalReeds; i++)
				{
					var thingy = new Object()
						thingy.column = Math.floor(random(1, gridWidth))
						thingy.row = Math.floor(random(1, gridHeight))
					reeds.push(thingy)
				}
			}

			if (zombies.length == 0) // Spawn zombies if we have none currently
			{
				for (var i = 0; i < totalZombies; i++)
				{
					var thingy = new Object()
						thingy.name = 'zombie' + i
						thingy.column = Math.floor(random(1, gridWidth))
						thingy.row = Math.floor(random(1, gridHeight))
						thingy.health = random(zombieMinHealth, zombieMaxHealth)
						thingy.frame = random(0, 1)
						thingy.animate = animate(thingy, slowestAnimation)
						thingy.nature = Math.floor(random(0, 1))
						thingy.hunt = hunt(thingy, random(0, 1))
					zombies.push(thingy)
				}

				setInterval(function()
				{
					hurtPlayer()
				}, 1000)
			}
			else // Or do things with the zombies we have
			{
                for (var i = 0; i < totalZombies; i++)
                {
                    zombies[i].distance = distance(zombies[i])
                    zombies[i].bearing = bearing(zombies[i])
            
                    if ((compass - fieldOfView) < zombies[i].bearing && zombies[i].bearing < (compass + fieldOfView))
                    {
                        if (zombies[i].distance > minShotDistance && zombies[i].distance < maxShotDistance && zombies[i].health > 0)
                        {
                            vision.push(zombies[i])
                            // sfxSweep.play()
                        }
                    }
                }
            
                if (vision.length > 0)
                {
                    zombies.sort(function(a, b) // Order the zombies that are in our sights according to distance
                    {
                        return a.distance - b.distance
                    })
                }
			}

			if (ammo.length == 0) // Make ammo packs if we have none
			{
				for (var i = 0; i < totalAmmo; i++)
				{
					var thingy = new Object()
						thingy.column = Math.floor(random(1, gridWidth))
						thingy.row = Math.floor(random(1, gridHeight))
						thingy.count = random(ammoCountLow, ammoCountHigh)
					ammo.push(thingy)
				}
			}

			// ******************************
			// Attack motions
			// ******************************

		    if (acceleration.total > accelRequiredMelee) // Melee attack!
			{
				if (canMelee)
				{
					punch()
				}
			}

		    if (((90 - 25) < Math.abs(tilt.y)) && (Math.abs(tilt.y) < (90 + 25))) // Watch for gun orientation
		    {
		        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		        // Things are only set up for right handed users right now
		        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		        if (-rotation.y > rotateRequiredReload) // Reload
		        {
		            reload()
		        }

		        if (-rotation.z > rotateRequiredShoot) // Fire
		        {
		            fire()
		        }
		    }

		    // ******************************
			// Draw
			// ******************************

		    drawGame()
		}
		else if (gps.accuracy > 0)
		{
			blank(red)
			text('Waiting for GPS lock', 3, 3, white)
			text('Are you outside?', 3, 13, white)
			text('Can you see the sky?', 3, 23, white)
		}
		else if (gps.accuracy > 15)
		{
			blank(red)
			text('Current GPS accuracy of ' + gps.accuracy + ' meters is not accurate enough', 3, 3, white)
			text('Are you outside?', 3, 13, white)
			text('Can you see the sky?', 3, 23, white)
		}
	}
	else if (currentScreen == 'settings')
	{
		blank(black)
		image(imgBackArrow, 10, 10, 'normal', 0.25)
		if (debug)
		{
			image(imgBug, canvas.width / 2, 150, 'center')
		}
		else
		{
			image(imgBug, canvas.width / 2, 150, 'center', 0.5)
		}
	}
	else if (currentScreen == 'gameover')
	{
		blank(red)
		text('GAMEOVER', 3, 3, white)
		text('Tap to play again', 3, 13, white)
	}
}, 1000 / fps)