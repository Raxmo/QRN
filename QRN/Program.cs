using System;
using OpenTK.Windowing.Desktop;
using OpenTK.Mathematics;
using OpenTK.Windowing.Common;
using OpenTK.Graphics.OpenGL4;
using System.IO;

namespace QRN
{
	class Program
	{
		#region Entry Point
		static void Main(string[] args)
		{
			#region Boilerplate
			// declarations
			GameWindowSettings GWs = GameWindowSettings.Default;
			NativeWindowSettings NWs = NativeWindowSettings.Default;

			// Game Window settings
			GWs.IsMultiThreaded = false;
			GWs.RenderFrequency = 60;
			GWs.UpdateFrequency = 60;

			// Native Window Setings
			NWs.APIVersion = Version.Parse("4.1.0");
			NWs.Size = new Vector2i(1600, 900);
			NWs.Title = "QRN:  Dead Air";

			// create window
			GameWindow GW = new GameWindow(GWs, NWs);
			GW.UpdateFrame += (FrameEventArgs args) =>
			{
				// Put game loop here
			};

			ShaderProgram SProg = new ShaderProgram() { id = 0 };
			GW.Load += () =>
			{
				SProg = ShaderProgram.Load("Resources/Screen.vert", "Resources/Screen.frag");
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
					-1.0f,  1.0f, 0.0f,
					 1.0f,  1.0f, 0.0f,

					 1.0f,  1.0f, 0.0f,
					 1.0f, -1.0f, 0.0f,
					-1.0f, -1.0f, 0.0f
				};
				int vao = GL.GenVertexArray();
				int vertecies = GL.GenBuffer();

				// Data setup
				GL.BindVertexArray(vao);
				GL.BindBuffer(BufferTarget.ArrayBuffer, vertecies);
				GL.BufferData(BufferTarget.ArrayBuffer, verts.Length * sizeof(float), verts, BufferUsageHint.StaticCopy);
				GL.EnableVertexAttribArray(0);
				GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 0, 0);

				// Drawing
				GL.DrawArrays(PrimitiveType.Triangles, 0, 6);

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
	}
}
