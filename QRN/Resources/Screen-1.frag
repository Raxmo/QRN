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

uniform bool doCorrection = false;
// ---------------------------------------- //
// <<<<<<<<<<----- other variables ----->>>>>>>>>> //
out vec4 fragcol;
vec2 suv = (iCoord - 0.5 * wres) / wres.x;

const float Pi = atan(-1.0, 0.0);
const float Phi = (1.0 + sqrt(5.0)) / 2.0;

const float FOV = 1.0;
const float maxdist = 3.0;

const float correction = cos(suv.x * FOV);
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
float getdist(in vec2 ro, in vec2 rd, out vec2 wuv, inout vec2 fuv, inout vec2 cuv)
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

	fdist = min(deltafloor   / max(0.0, -suv.y), maxdist);
	cdist = min(deltaceiling /  max(0.0, suv.y), maxdist);

	bool isfloor   = ivec2(ro + rd * fdist) == check;
	bool isceiling = ivec2(ro + rd * cdist) == check;
	bool iswall = false;
	bool hit = isfloor || isceiling;

	// wall set-up
	dist = min(tdist.x, tdist.y);
	wuv.y = ((suv.y * dist + deltafloor));

	fuv = fract(ro + rd * fdist) * float(isfloor);
	cuv = fract(ro + rd * cdist) * float(isceiling);
	
	// next cell set-up
	ncheck.x = int(float(tdist.x <= tdist.y) * sign(rd.x));
	ncheck.y = int(float(tdist.y <= tdist.x) * sign(rd.y));
	ncheck += check;
	
	float nfloor = min(getFloor(ncheck), firstceiling + firstfloor);
	
	float dtfloor = nfloor - firstfloor;
	float nceiling = getCeiling(ncheck) + dtfloor;
	
	// check next floor against the current wall
	iswall = (wuv.y <= dtfloor || wuv.y >= nceiling) && !isfloor && !isceiling;
	hit = hit || iswall;
	wuv /= 5.0;
	wuv.y *= float(iswall);

	// loop stuffs
	while(dist < maxdist && !hit)
	{
		//hit = true;
		deltafloor = playvert.x - dtfloor;
		deltaceiling = nceiling - playvert.x;

		tdist = tdist + deltadist * vec2((tdist.x < tdist.y), (tdist.y < tdist.x));

		dist = min(tdist.x, tdist.y);

		fdist = min(deltafloor   / max(0.0, -suv.y), maxdist);
		cdist = min(deltaceiling / max(0.0,  suv.y), maxdist);

		check = ncheck;
		
		bool isfloor   = ivec2(ro + rd * fdist) == check;
		bool isceiling = ivec2(ro + rd * cdist) == check;
		
		fuv = fract(ro + rd * fdist) * float(isfloor);
		cuv = fract(ro + rd * cdist) * float(isceiling);

		wuv.y = ((suv.y * dist + deltafloor)) * float(!isfloor) * float(!isceiling) / 5.0;

		// next cell set-up
		ncheck.x = int(float(tdist.x <= tdist.y) * sign(rd.x));
		ncheck.y = int(float(tdist.y <= tdist.x) * sign(rd.y));
		ncheck += check;

		nfloor = min(getFloor(ncheck), firstceiling + firstfloor);
		
		dtfloor = nfloor - firstfloor;
		nceiling = getCeiling(ncheck) + dtfloor;
		
		// check next floor against the current wall
		iswall = (wuv.y <= dtfloor || wuv.y >= nceiling) && !isfloor && !isceiling;
		hit = iswall || isfloor || isceiling;
	}
	// - - - - - - - - - - - - - - - - - //
	return min(min(dist, min(fdist, cdist)), maxdist);
}
// --------------------- //
// ----- Textures ----- //
// -------------------- //
// ===== Main Function ===== //
void main()
{
	float col = 0.0;
	// - - - - - - - - - - - - - - - - - //
	suv.y *= 20.0;
	vec2 wuv = vec2(0.0);
	vec2 fuv = vec2(0.0);
	vec2 cuv = vec2(0.0);
	float dist = getdist(player.xy, vec2(cos(player.z + suv.x * FOV), sin(player.z + suv.x * FOV)), wuv, fuv, cuv);
	
	col = clamp(wuv.y, 0.0, 1.0) + max(fuv.y, fuv.x) + max(cuv.x, cuv.y);
	//col = (fcuv.x + fcuv.y) / 2.0;
	col = dist / maxdist;
	// - - - - - - - - - - - - - - - - - //
	fragcol = vec4(vec3(col), 1.0);
}
// ========================= //