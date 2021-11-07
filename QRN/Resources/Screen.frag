#version 430
#define iCoord gl_FragCoord.xy
const float PI = 3.141592654;

out vec4 fragcol;

uniform vec2 wres = vec2(1.0);
uniform uint frame = 0;

const float FOV = 1.0;

uniform vec3 player = vec3(3, 2, 0.0);
uniform vec2 playvert = vec2(0.0);

vec2 suv = (iCoord - 0.5 * wres)/wres.x - vec2(0.0, 0.0);

// Map data stuffs
uniform sampler2D MapData;
uniform ivec2 msize = ivec2(256, 256);

const float PHI = (1.0 * sqrt(5.0)) / 2.0;
float noise(in vec2 xy)
{
	return fract(tan(distance(xy * PHI, xy) * frame) * xy.x);
}

float maxdist = 20.0;

float FloorColor(in vec2 uv)
{
	float col = 0.0;
	
	vec2 t = (uv);
	t = (t - 0.5) * 2.0;
	t = abs(t);
	
	col = max(t.x, t.y);
	col = 1.0 - col;
	
	float width = 0.2;
	col -= width / 40.0;
	col /= width;
	col = clamp(col, 0.0, 1.0);

	return col;
}

float WallColor(in vec2 uv)
{
	float col = 0.0;
	vec2 t = vec2(uv);
	t *= vec2(1.0, 2.0);
	t.x = t.x + float(int(t.y)) * 0.5 + 0.25;
	t = fract(abs(t));
	
	t = (t - 0.5) * 2.0;
	t = abs(t);
	t.x -= 0.5;
	t.x *= 2.0;
	
	col = max(t.x, t.y);
	col = 1.0 - col;

	float width = 0.5;
	col -= width / 10.0;
	col /= width;
	col = clamp(col, 0.0, 1.0);
	
	return col;
}

void main()
{
	//declare color variable
	float col = 0.0;
	float wallheight = 5.0;
	// --------------------------------- //
	// Screen UV transformations //
	suv.y += playvert.y;
	// ------------------------------------ //
	// --- Rendering declariations --- //
	float dist = 0.0;
	float fdist = min(abs(0.5 * wallheight / suv.y), maxdist);

	bool isNS = false;

	bool hit = false;
	float rayangle = player.z + suv.x * FOV;
	vec2 avec = vec2(cos(rayangle), sin(rayangle));
	vec2 side = vec2
	(
		sqrt(1 + (avec.y * avec.y) / (avec.x * avec.x)),
		sqrt(1 + (avec.x * avec.x) / (avec.y * avec.y))
	);
	vec2 delta = vec2(0.0);
	ivec2 check = ivec2
	(
		int(player.x),
		int(player.y)
	);
	ivec2 stepvec = ivec2(0);
	// ----------------------------------------- //
	// --- Algorithm setup --- //
	if (avec.x < 0.0)
	{
		stepvec.x = -1;
		delta.x = (player.x - float(check.x)) * side.x;
	}
	else
	{
		stepvec.x = 1;
		delta.x = (int(check.x) + 1.0 - player.x) * side.x;
	}
	if (avec.y < 0.0)
	{
		stepvec.y = -1;
		delta.y = (player.y - float(check.y)) * side.y;
	}
	else
	{
		stepvec.y = 1;
		delta.y = (float(check.y) - player.y + 1) * side.y;
	}
	// ------------------------------------- //
	// --- DDA algorithm --- //
	while (!hit && dist < maxdist)
	{
		if (delta.x < delta.y)
		{
			check.x += stepvec.x;
			dist = delta.x;
			delta.x += side.x;
			isNS = false;
		}
		else
		{
			check.y += stepvec.y;
			dist = delta.y;
			delta.y += side.y;
			isNS = true;
		}

		if (check.x >= 0 && check.x < msize.x && check.y >= 0 && check.y < msize.y)
		{
			if ( texture2D(MapData, check / vec2(msize)).r > 0)
			{
				hit = true;
				dist = min(dist, maxdist);
			}
		}
	}
	// ---------------------------------------- //
	// --- UV mapping --- //
	vec2 wuv = vec2(0.0);
	vec2 fuv = vec2(0.0);

	fuv = fract(avec * fdist + player.xy);

	if(isNS)
	{
		if(avec.y < 0) // <- Looking North
		{
			wuv.x = fract((avec * dist + player.xy).x);
		}
		else // <- Looking South
		{
			wuv.x = 1.0 - fract((avec * dist + player.xy).x);
		}
	}
	else
	{
		if(avec.x < 0) // <- Looking West
		{
			wuv.x = 1.0 - fract((avec * dist + player.xy).y);
		}
		else // <- Looking East
		{
			wuv.x = fract((avec * dist + player.xy).y);
		}
	}

	wuv.y = fract(suv.y * dist - 0.5 * wallheight);

	bool iswall = dist < fdist;

	float floorcol = float(fuv.x + fuv.y) * float(!iswall);
	float wallcol = float(wuv.x + wuv.y) * float(iswall);

	col = WallColor(wuv) * float(iswall) + FloorColor(fuv) * float(!iswall);
	// ------------------------------------------- //
	dist = min(fdist, dist);
	float fog = 1.0 - (dist / (maxdist));

	col *= fog;
	// --------------------------------- //
	// Final output
	col = clamp(col, 0.001, 0.999);
	//col = float(noise(gl_FragCoord.xy) < col);
	//col = texture(MapData, suv).r;
	fragcol = vec4(vec3(col), 1.0);
}