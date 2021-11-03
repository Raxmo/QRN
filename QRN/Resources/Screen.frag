#version 430
const float PI = 3.141592654;

out vec4 fragcol;

uniform vec2 wres = vec2(1.0);
uniform uint frame = 0;

const float FOV = 1.0;

vec2 suv = gl_FragCoord.xy / wres.x - vec2(0.0, 0.5 * (wres.y / wres.x));

// Map data stuffs
#define MapWidth 9
#define MapHeight 6
uniform uint[MapHeight][MapWidth] MapFloors = 
{
	{1, 1, 1, 1, 1, 1, 1, 1, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 1, 1, 1, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 1, 0, 1},
	{1, 1, 1, 1, 1, 1, 1, 1, 1}
};

const float PHI = (1.0 * sqrt(5.0)) / 2.0;
float noise(in vec2 xy)
{
	return fract(tan(distance(xy * PHI, xy) * frame) * xy.x);
}

uniform vec3 player = vec3(3, 2, 0.0);

float maxdist = 6.0;

float FloorColor(in vec2 uv)
{
	float col = 0.0;
	
	vec2 f = vec2(abs(uv));
	col = max(f.x, f.y);
	float width = 0.1;
	
	col = clamp(2.0 * (1.0 - width - col) / width + 1.0, 0.0, 1.0);
	

	return col;
}

float WallColor(in vec2 uv)
{
	float col = 0.0;
	vec2 t = fract(uv);
	t *= vec2(2.0, 4.0);
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
	// --------------------------------- //
	// --- Rendering declariations --- //
	float dist = 0.0;
	float fdist = min(abs(0.5 / suv.y), maxdist);

	bool isNS = false;

	bool hit = false;
	float rayangle = player.z - FOV / 2.0 + suv.x * FOV;
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

		if (check.x >= 0 && check.x < MapWidth && check.y >= 0 && check.y < MapHeight)
		{
			if (MapFloors[check.y][check.x] > 0)
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

	fuv = (fract(avec * fdist + player.xy) - 0.5) * 2.0;

	if(isNS)
	{
		wuv.x = -sign(avec.y) * ((fract(avec.x * dist + player.x) - 0.5) * 2.0);
	}
	else
	{
		wuv.x = sign(avec.x) * ((fract(avec.y * dist + player.y) - 0.5) * 2.0);
	}

	wuv.y = 2.0 * suv.y * dist;

	bool iswall = dist < fdist;

	float floorcol = float(fuv.x + fuv.y) * float(!iswall);
	float wallcol = float(wuv.x + wuv.y) * float(iswall);

	col = WallColor(wuv) * float(iswall) + FloorColor(fuv) * float(!iswall);
	// ------------------------------------------- //
	
	dist = min(fdist, dist);
	float fog = 1.0 - (dist / maxdist);

	col *= fog;
	// --------------------------------- //
	// Final output
	col = clamp(col, 0.001, 0.999);
	col = float(noise(gl_FragCoord.xy) < col);
	fragcol = vec4(vec3(col), 1.0);
}