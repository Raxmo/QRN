using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;
using OpenTK.Windowing.Common;
using OpenTK.Windowing.Desktop;
using OpenTK.Windowing.GraphicsLibraryFramework;
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace QRN
{
	class Program
	{
		static uint[,] Map = new uint[,]
{
	{1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
	{1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1},
	{1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1},
	{1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1}
};

		static Bitmap MapImg;

		#region Entry Point
		static void Main(string[] args)
		{
			#region Boilerplate
			// declarations
			GameWindowSettings GWs = GameWindowSettings.Default;
			NativeWindowSettings NWs = NativeWindowSettings.Default;
			Stopwatch sw = Stopwatch.StartNew();
			double timeEllapsed = 0.0;
			double deltat = 0.0;

			// Game Window settings
			GWs.IsMultiThreaded = false;
			GWs.RenderFrequency = 60;
			GWs.UpdateFrequency = 60;

			// Native Window Setings
			NWs.APIVersion = Version.Parse("4.3.0");
			NWs.Size = new Vector2i(1600, 900);
			NWs.Title = "QRN:  Dead Air";

			// create window
			GameWindow GW = new GameWindow(GWs, NWs);

			// Window set-up
			ShaderProgram SProg = new ShaderProgram() { id = 0 };
			int wres = -1;
			int frameid = -1;
			int unifplayer = -1;
			int uniplayvert = -1;
			int uniMap = -1;
			int uniMapData = -1;
			int unimsize = -1;
			GW.Load += () =>
			{
				SProg = ShaderProgram.Load("Resources/Screen.vert", "Resources/Screen.frag");
				wres = GL.GetUniformLocation(SProg.id, "wres");
				frameid = GL.GetUniformLocation(SProg.id, "frame");
				unifplayer = GL.GetUniformLocation(SProg.id, "player");
				uniplayvert = GL.GetUniformLocation(SProg.id, "playvert");
				uniMap = GL.GetUniformLocation(SProg.id, "MapFloors");
				uniMapData = GL.GetUniformLocation(SProg.id, "MapData");
				unimsize = GL.GetUniformLocation(SProg.id, "msize");

				#region map texture stuffs
				MapImg= new Bitmap("Resources/map-1.png");
				//bmp.RotateFlip(RotateFlipType.RotateNoneFlipY);

				int texture = GL.GenTexture();
				GL.BindTexture(TextureTarget.Texture2D, texture);

				BitmapData bmpdat = MapImg.LockBits(new Rectangle(0, 0, MapImg.Width, MapImg.Height), ImageLockMode.ReadOnly, System.Drawing.Imaging.PixelFormat.Format32bppArgb);
				GL.TexImage2D(TextureTarget.Texture2D, 0, PixelInternalFormat.Rgba, MapImg.Width, MapImg.Height, 0, OpenTK.Graphics.OpenGL4.PixelFormat.Rgba, PixelType.UnsignedByte, bmpdat.Scan0);
				MapImg.UnlockBits(bmpdat);
				GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureMinFilter, (int)TextureMinFilter.Nearest);
				GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureMagFilter, (int)TextureMagFilter.Nearest);
				#endregion

				#region Map setup
				GL.UseProgram(SProg.id);

				GL.Uniform2(unimsize, new Vector2i(MapImg.Width, MapImg.Height));

				GL.UseProgram(0);
				#endregion
			};

			// Game loop stuffs
			uint frame = 0;
			Vector3 player = new Vector3(2.5f, 1.5f, 0.0f);
			Vector2 playvert = new Vector2(0.0f, 0.0f);
			float radius = 1.5f;
			GW.UpdateFrame += (FrameEventArgs args) =>
			{
				double curt = sw.ElapsedMilliseconds / 1000.0;
				deltat = curt - timeEllapsed;
				timeEllapsed = curt;
				frame++;

				KeyboardState kstate = GW.KeyboardState;

				double playerspeed = 5.0;

				if(kstate.IsKeyDown(Keys.D))
				{
					player.Z += (float)(1.0 * deltat);
				}
				if(kstate.IsKeyDown(Keys.A))
				{
					player.Z -= (float)(1.0 * deltat);
				}
				if(kstate.IsKeyDown(Keys.R))
				{
					playvert.Y = (float)Math.Clamp(playvert.Y + 0.4 * deltat, -0.5, 0.5);
				}
				if(kstate.IsKeyDown(Keys.F))
				{
					playvert.Y = (float)Math.Clamp(playvert.Y - 0.4 * deltat, -0.5, 0.5);
				}


				double DPX = 0;
				double DPY = 0;
				if (kstate.IsKeyDown(Keys.W))
				{
					DPX += Math.Cos(player.Z) * deltat * playerspeed;
					DPY += Math.Sin(player.Z) * deltat * playerspeed;
				}
				if (kstate.IsKeyDown(Keys.S))
				{
					DPX -= Math.Cos(player.Z) * deltat * playerspeed;
					DPY -= Math.Sin(player.Z) * deltat * playerspeed;
				}

				double potpx = player.X + DPX;
				double potpy = player.Y + DPY;

				int scx = (int)(potpx - 3.0);
				int scy = (int)(potpy - 3.0);
				int ecx = (int)(potpx + 3.0);
				int ecy = (int)(potpy + 3.0);

				for (int cy = scy; cy <= ecy; cy++)
				{
					for (int cx = scx; cx <= ecx; cx++)
					{
						
						if (cy >= 0 && cx >= 0 && cy < MapImg.Width && cx < MapImg.Height && MapImg.GetPixel(cx, cy).R >= 1)
						{
							double nx = Math.Clamp(potpx, cx, cx + 1);
							double ny = Math.Clamp(potpy, cy, cy + 1);

							double rx = nx - potpx;
							double ry = ny - potpy;
							double rm = Math.Sqrt(rx * rx + ry * ry);
							double nrx = rx / rm;
							double nry = ry / rm;

							double ovlp = radius - rm;
							if (double.IsNaN(ovlp)) ovlp = 0;

							if (ovlp > 0)
							{
								potpx = potpx - nrx * ovlp;
								potpy = potpy - nry * ovlp;
							}
						}
					}
				}

				player.X = (float)potpx;
				player.Y = (float)potpy;
			};

			// Rendering logic
			GW.RenderFrame += (FrameEventArgs args) =>
			{
				// Declarations
				GL.Clear(ClearBufferMask.ColorBufferBit);
				GL.UseProgram(SProg.id);

				// Data declaration
				float[] verts =
				{
					-1.0f, -1.0f, 0.0f,
					-1.0f,  3.0f, 0.0f,
					 3.0f, -1.0f, 0.0f
				};
				int vao = GL.GenVertexArray();
				int vertecies = GL.GenBuffer();
				
				// Data setup
				GL.BindVertexArray(vao);
				GL.BindBuffer(BufferTarget.ArrayBuffer, vertecies);
				GL.BufferData(BufferTarget.ArrayBuffer, verts.Length * sizeof(float), verts, BufferUsageHint.StaticCopy);
				GL.EnableVertexAttribArray(0);
				GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 0, 0);

				// Uniforms
				GL.Uniform2(wres, GW.Size);
				GL.Uniform1(frameid, frame / 3);
				GL.Uniform3(unifplayer, player);
				GL.Uniform2(uniplayvert, playvert);


				// Drawing
				GL.DrawArrays(PrimitiveType.Triangles, 0, 3);

				// Cleanup
				GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
				GL.BindVertexArray(0);
				GL.DeleteBuffer(vertecies);
				GL.DeleteVertexArray(vao);

				// Display to screen
				GW.SwapBuffers();
			};

			// Run window
			GW.Run();
			#endregion
		}
		#endregion

		#region Helper Structs
		public struct Shader
		{
			#region Fields
			public int id;
			#endregion

			#region Methods
			public static Shader Load(string location, ShaderType type)
			{
				// Declarations
				int id = GL.CreateShader(type);

				// Processing
				GL.ShaderSource(id, File.ReadAllText(location));
				GL.CompileShader(id);

				// Error checking
				string infolog = GL.GetShaderInfoLog(id);
				if(!string.IsNullOrEmpty(infolog))
				{
					throw new Exception(infolog);
				}

				// Return
				return new Shader() { id = id };
			}
			#endregion

		}

		public struct ShaderProgram
		{
			#region Fields
			public int id;
			#endregion

			#region Methods
			public static ShaderProgram Load(string vertlocation, string fraglocation)
			{
				// Declarations
				int id = GL.CreateProgram();

				Shader vert = Shader.Load(vertlocation, ShaderType.VertexShader);
				Shader frag = Shader.Load(fraglocation, ShaderType.FragmentShader);

				// Processing
				GL.AttachShader(id, vert.id);
				GL.AttachShader(id, frag.id);
				GL.LinkProgram(id);

				// Cleanup
				GL.DetachShader(id, vert.id);
				GL.DetachShader(id, frag.id);
				GL.DeleteShader(vert.id);
				GL.DeleteShader(frag.id);

				// Error checking
				string infolog = GL.GetProgramInfoLog(id);
				if(!string.IsNullOrEmpty(infolog))
				{
					throw new Exception(infolog);
				}

				// Retern
				return new ShaderProgram() { id = id };
			}
			#endregion
		}
		#endregion

		#region Classes

		#endregion
	}
}
