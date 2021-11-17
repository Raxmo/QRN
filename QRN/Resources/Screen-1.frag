#version 430
// ----- Defines ----- //
#define iCoord gl_FragCoord.xy
// ------------------- //
// <<<<<<<<<<----- Uniforms ----->>>>>>>>>> //
uniform uint frame = 0;
uniform vec2 wres = vec2(1.0);

uniform sampler2D MapData;
uniform ivec2 msize = ivec2(256, 256);

uniform vec3 player = vec3(3.5, 3.5, 0.0);
uniform vec2 playvert = vec2(2.5, 0.0);

uniform bool doCorrection = true;
// ---------------------------------------- //
// <<<<<<<<<<----- other variables ----->>>>>>>>>> //
out vec4 fragcol;
vec2 suv = (iCoord - 0.5 * wres) / wres.x;

const float Pi = atan(-1.0, 0.0);
const float Phi = (1.0 + sqrt(5.0)) / 2.0;

const float FOV = 1.0;
const float maxdist = 40.0;

const float correctionval = cos(suv.x * FOV);
const float correction = correctionval * float(doCorrection) + float(!doCorrection);
// ----------------------------------------------- //
// ----- Functions ----- //
float noise(in vec2 xy)
{
	return fract(tan(distance(xy * Phi, xy) * frame) * xy.x);
}
vec4 getCell(in ivec2 location)
{
	return 255.0 * texture2D(MapData, location / vec2(msize));
}
float getFloor(in ivec2 location)
{
	return getCell(location).b;
}
float getCeiling(in ivec2 location)
{
	return getCell(location).g;
}
// - - - - - - - - - - - - - - - - - - - //
float getdist(in vec2 ro, in vec2 rd, out vec2 wuv, out vec2 fuv, out vec2 cuv, out bool isfloor, out bool isceiling, out bool iswall)
{
	float dist = 0.0;
	// - - - - - - - - - - - - - - - - - //
	// set-up declairations
	vec2 tdist = vec2(0.0);
	vec2 deltadist = vec2(0.0);
	ivec2 check = ivec2(ro);
	ivec2 ncheck = ivec2(check);
	float slope = rd.y / rd.x;
	float fdist = 0.0;
	float cdist = 0.0;
	
	// initial calculations
	deltadist.x = sqrt(1.0 +        slope  *        slope);
	deltadist.y = sqrt(1.0 + (1.0 / slope) * (1.0 / slope));

	tdist = fract(1.0 - fract(ro) * sign(rd)) * deltadist;

	// --- First cell stuffs --- //
	// set-up
	float firstfloor = getFloor(check);
	float firstceiling = getCeiling(check);
	
	float deltafloor = playvert.x;
	float deltaceiling = firstceiling - playvert.x;

	fdist = min(deltafloor   / max(0.0, -suv.y), maxdist) / correction;
	cdist = min(deltaceiling /  max(0.0, suv.y), maxdist) / correction;

	isfloor   = ivec2(ro + rd * fdist) == check;
	isceiling = ivec2(ro + rd * cdist) == check;
	iswall = false;
	bool hit = isfloor || isceiling;

	fuv = fract(ro + rd * fdist) * float(isfloor);
	cuv = fract(ro + rd * cdist) * float(isceiling);

	// wall set-up
	dist = min(tdist.x, tdist.y) * correction;
	wuv.y = (suv.y * dist + deltafloor) * float(!hit);

	// loop stuffs
	while(dist < maxdist && !hit)
	{
		// --- Previouse cell stuffs --- //
		float previousfloor = getFloor(check);

		// --- Next cell stuffs --- //
		// calculate the step to next cell
		check += ivec2(sign(rd)) * ivec2(int(tdist.x <= tdist.y), int(tdist.y <= tdist.x));

		// get info of next cell
		float floordif = getFloor(check) - firstfloor;
		float ceildif = getCeiling(check) + floordif;

		deltafloor = playvert.x - floordif;
		deltaceiling = getCeiling(check) - deltafloor;
		
		// calculate floor and ceiling distances
		fdist = min(deltafloor   / -suv.y, maxdist) / correction;
		cdist = min(deltaceiling /  suv.y, maxdist) / correction;

		// calculate wall height checks
		iswall = (wuv.y <= floordif - previousfloor + firstfloor) || (wuv.y >= ceildif - previousfloor + firstfloor);
		
		// calculate what is floor or ceiling
		isfloor   = ivec2(ro + rd * fdist) == check && suv.y <= 0.0 && !iswall;
		isceiling = ivec2(ro + rd * cdist) == check && suv.y >= 0.0 && !iswall;
		hit = isfloor || isceiling;
		
		// calculate floor and ceiling UVs
		fuv = fract(ro + rd * fdist) * float(isfloor);
		cuv = fract(ro + rd * cdist) * float(isceiling);
		
		// --- Wall Stuffs --- //
		// current cell walls		
		wuv.y = wuv.y * float(!hit && iswall);
		
		hit = hit || iswall;

		if(hit) continue;

		// next cell potential walls
		tdist += deltadist * vec2(tdist.x <= tdist.y, tdist.y <= tdist.x);
		dist = min(tdist.x, tdist.y) * correction;
		wuv.y = (suv.y * dist + deltafloor);
	}
	// - - - - - - - - - - - - - - - - - //
	float maxmask = maxdist * float(!hit);

	dist = dist * float(iswall);
	fdist = fdist * float(isfloor);
	cdist = cdist * float(isceiling);

	vec2 ruv = clamp(ro + rd * dist / correction - vec2(check), 0.0, 1.0);
	ruv = (ruv - 0.5) * 2.0;

	vec2 t = ruv;
	t.x = -ruv.y / ruv.x;
	t.y =  ruv.x / ruv.y;

	t = (t / 2.0) + 0.5;
	t.x = t.x * float(t.x >= 0.0 && t.x <= 1.0);
	t.y = t.y * float(t.y >= 0.0 && t.y <= 1.0);

	wuv.x = t.x + t.y;
	
	dist += fdist;
	dist += cdist;
	dist += maxmask;

	return dist;
}
// --------------------- //
// ----- Textures ----- //
float CeilingTexture(in vec2 uv)
{
	float col = 0.0;
	// - - - - - - - - - - - - - - - - //
	vec2 tuv = (uv - 0.5) * 2.0;
	col = length(tuv);
	col = 1.0 - clamp(col, 0.0, 1.0);
	// - - - - - - - - - - - - - - - - //
	return col;
}
float FLoorTexture(in vec2 uv)
{
	float col = 0.0;
	// - - - - - - - - - - - - - - - - //
	vec2 tuv = (uv - 0.5) * 2.0;
	tuv = 1.0 - abs(tuv);
	col = min(tuv.x, tuv.y) * 10.0;
	col = clamp(col, 0.0, 1.0);
	// - - - - - - - - - - - - - - - - //
	return col;
}
float WallTexture(in vec2 uv)
{
	float col = 0.0;
	// - - - - - - - - - - - - - - - - //
	vec2 tuv = uv * vec2(2.0, 4.0);
	tuv.x += float(int(tuv.y)) / 2.0;
	tuv = fract(tuv);
	tuv -= 0.5;
	tuv = abs(tuv) * 2.0;
	tuv.x -= 0.5;
	tuv.x *= 2.0;
	col = 1.0 - max(tuv.x, tuv.y);
	col -= 0.025;
	col *= 2.0;

	//col = max(fract(uv.x), fract(uv.y));
	// - - - - - - - - - - - - - - - - //
	col = clamp(col, 0.0, 1.0);
	return col;
}
// -------------------- //
// ===== Main Function ===== //
void main()
{
	float col = 0.0;
	// - - - - - - - - - - - - - - - - - //
	//suv.y *= 20.0;
	vec2 wuv = vec2(0.0);
	vec2 fuv = vec2(0.0);
	vec2 cuv = vec2(0.0);
	bool isfloor = false;
	bool isceiling = false;
	bool iswall = false;
	float dist = getdist
				(
					player.xy,
					vec2(cos(player.z + suv.x * FOV),
					     sin(player.z + suv.x * FOV)),
					wuv,
					fuv,
					cuv,
					isfloor,
					isceiling,
					iswall
				);
	
	col += WallTexture(wuv) * float(iswall);
	col += FLoorTexture(fuv) * float(isfloor);
	col += CeilingTexture(cuv) * float(isceiling);
	col *= 1.0 - dist / maxdist;
	// - - - - - - - - - - - - - - - - - //
	//col = float(noise(iCoord) < clamp(col, 0.05, 0.995));
	fragcol = vec4(vec3(col), 1.0);
}
// ========================= //