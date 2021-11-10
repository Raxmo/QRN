#version 430
#define iCoord gl_FragCoord.xy
const float PI = 3.141592654;

out vec4 fragcol;

uniform vec2 wres = vec2(1.0);
uniform uint frame = 0;

const float FOV = 1.0;

uniform vec3 player = vec3(3, 2, 0.0);
uniform vec2 playvert = vec2(0.0);

vec2 suv = (iCoord - 0.5 * wres)/wres.x;

// Map data stuffs
uniform sampler2D MapData;
uniform ivec2 msize = ivec2(256, 256);

const float PHI = (1.0 + sqrt(5.0)) / 2.0;
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
	float playerheight = 2.5;
	// --------------------------------- //
	// Screen UV transformations //
	suv.y += playvert.y;
	// ------------------------------------ //
	// --- Rendering declariations --- //
	float dist = 0.0;

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
	// ----- player's cell stuffs ----- //
	float pfloor = 255.0 * texture2D(MapData, check / vec2(msize)).b;
	float pceil = 255.0 * texture2D(MapData, check / vec2(msize)).g;
	
	float fdist = 0.0;
	float cdist = 0.0;

	fdist = min(maxdist, playerheight / max(0.0, -suv.y));
	cdist = min(maxdist, (pceil - playerheight) / max(0.0, suv.y));


	hit = (ivec2(player.xy + avec * fdist) == check) || (ivec2(player.xy + avec * cdist) == check);

	//dist = float(hit) * min(fdist, cdist);

	float tdist = fdist;

	// --- UV mapping PT. 1 --- //
	vec2 wuv = vec2(0.0);
	vec2 fuv = vec2(0.0);
	// --- DDA algorithm --- //
	while (!hit && dist <= maxdist)
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
			// we have entered a new valid cell
			vec3 cell = 255.0 * texture2D(MapData, check / vec2(msize)).bgr;
			
			// calculate ceiling distance and floor distances
			float fheight = pfloor - cell.r + playerheight;
			float cheight = pfloor + cell.r + cell.g - playerheight;

			fdist = min(maxdist, fheight / -suv.y);
			cdist = min(maxdist, cheight /  suv.y);
			
			fdist = clamp(fdist, 0.0, maxdist);
			cdist = clamp(cdist, 0.0, maxdist);

			// check to see if the ray hits the floor or ceiling
			hit = (ivec2(player.xy + avec * fdist) == check && fdist > 0.0) || (ivec2(player.xy + avec * cdist) == check && cdist > 0.0);
			//hit = hit || (dist > fdist) || (dist > cdist);
			
			// UV stuffs
			fuv = fract(player.xy + avec * fdist) * float(suv.y < 0) + fract(player.xy + avec * cdist) * float(suv.y > 0);
			
			//dist = min(max(dist, fdist), max(dist, cdist));
			
			tdist = fdist;

			//bool thit = false;
			//if ( mcol.b > 0.0)
			//{
			//	thit = true;
			//	dist = min(dist, maxdist);
			//}
			//
			//wuv.y = suv.y * dist + 0.5 * wallheight;
			//
			//if(mcol.r < 1.0 && wuv.y < 4.0)
			//{
			//	float lfdist = fdist;
			//
			//	if(suv.y > 0.0 && thit)
			//	{
			//		fdist = sdist;
			//	}
			//	
			//	ivec2 fcheck = ivec2(player.xy + fdist * avec);
			//	
			//	if(fcheck != check)
			//	{
			//		fdist = lfdist;
			//	}
			//
			//	thit = false;
			//	
			//}
			//hit = thit;
		}
	}
	// ---------------------------------------- //
	// ----- UV stuffs pt 2 ----- //

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

	bool iswall = dist < fdist;

	float floorcol = float(fuv.x + fuv.y) * float(!iswall);
	float wallcol = float(wuv.x + wuv.y) * float(iswall);

	col = WallColor(fract(wuv)) * float(iswall) + FloorColor(fuv) * float(!iswall);
	// ------------------------------------------- //
	col = 1.0;
	//dist = min(fdist, dist);
	float fog = 1.0 - (tdist / (maxdist));

	col *= fog;
	// --------------------------------- //
	// Final output
	col = clamp(col, 0.001, 0.999);
	//col = float(noise(gl_FragCoord.xy) < col);
	//col = texture(MapData, suv).r;
	fragcol = vec4(vec3(col), 1.0);
	//fragcol = texture2D(MapData, suv);
}