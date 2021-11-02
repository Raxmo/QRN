#version 410
const float PI = 3.141592654;

out vec4 fragcol;

uniform vec2 wres = vec2(1.0, 1.0);
uniform uint frame = 0;

const float FOV = 1.0;

vec2 suv = (gl_FragCoord.xy - 0.5 * wres) / wres.x;

// Map data stuffs
uniform uint[54] MapFloors = uint[]
(
	1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 0, 0, 0, 0, 0, 0, 0, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1
);

const float PHI = (1.0 * sqrt(5.0)) / 2.0;
float noise(in vec2 xy)
{
	return fract(tan(distance(xy * PHI, xy) * frame) * xy.x);
}

vec3 player = vec3(3, 2, 0.0);

float maxdist = 6.0;

void main()
{
	//declare color variable
	float col = 0.0;
	// --------------------------------- //
	player.z += float(frame) * 0.01;
	float dist = 0.0;
	float fdist = min(abs(1.0 / suv.y), maxdist);

	bool isNS = false;

	bool hit = false;
	float rayangle = player.z - FOV / 2.0 + suv.x * FOV;
	float ax = cos(rayangle);
	float ay = sin(rayangle);
	float sx = sqrt(1 + (ay * ay) / (ax * ax));
	float sy = sqrt(1 + (ax * ax) / (ay * ay));
	float dx = 0.0;
	float dy = 0.0;
	int checkx = int(player.x);
	int checky = int(player.y);
	int stepx;
	int stepy;

	if (ax < 0.0)
	{
		stepx = -1;
		dx = (player.x - float(checkx)) * sx;
	}
	else
	{
		stepx = 1;
		dx = (int(checkx) + 1.0 - player.x) * sx;
	}
	if (ay < 0.0)
	{
		stepy = -1;
		dy = (player.y - float(checky)) * sy;
	}
	else
	{
		stepy = 1;
		dy = (float(checky) - player.y + 1) * sy;
	}

	while (!hit && dist < maxdist)
	{
		if (dx < dy)
		{
			checkx += stepx;
			dist = dx;
			dx += sx;
			isNS = false;
		}
		else
		{
			checky += stepy;
			dist = dy;
			dy += sy;
			isNS = true;
		}

		if (checkx >= 0 && checkx < 9 && checky >= 0 && checky < 6)
		{
			if (MapFloors[checky * 9 + checkx] > 0)
			{
				hit = true;
				
				dist = min(dist, maxdist);
			}
		}
	}
	
	dist = min(fdist, dist);
	col = 1.0 - (dist / maxdist);
	// --------------------------------- //
	// Final output
	col = clamp(col, 0.01, 0.99);
	col = float(noise(gl_FragCoord.xy) < col);
	fragcol = vec4(vec3(col), 1.0);
}