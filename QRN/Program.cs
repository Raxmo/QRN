using System;
using OpenTK.Windowing.Desktop;
using OpenTK.Mathematics;
using OpenTK.Windowing.Common;

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

			// Run window
			GW.Run();
			#endregion
		}
		#endregion
	}
}
