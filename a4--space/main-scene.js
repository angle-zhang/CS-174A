import {tiny, defs} from './assignment-4-resources.js';
                                                                // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Transforms_Sandbox_Base } = defs;

    // Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
    // This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// (Can define Main_Scene's class here)

const Main_Scene =
class Solar_System extends Scene
{                                             // **Solar_System**:  Your Assingment's Scene.
  constructor()
    {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
      super();
                                                        // At the beginning of our program, load one of each of these shape 
                                                        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape.
                                                        // Don't define blueprints for shapes in display() every frame.
      const Subdivision_Sphere_Flat = Subdivision_Sphere.prototype.make_flat_shaded_version();
      
      // TODO (#1):  Complete this list with any additional shapes you need.
      this.shapes = { 'box' : new Cube(),
                   'sub_1' : new Subdivision_Sphere( 1 ),
                   'sub_2' : new Subdivision_Sphere( 2 ),
                   'sub_3' : new Subdivision_Sphere_Flat( 3 ),
                   'sub_4' : new Subdivision_Sphere( 4 ),
                   'sub_5' : new Subdivision_Sphere( 5 ), //don't change
                   'sub_6' : new Subdivision_Sphere( 6 ),
                     'star' : new Planar_Star() };

      // TODO (#1d): Modify one sphere shape's existing texture 
      // coordinates in place.  Multiply them all by 5.
      this.shapes.sub_5.arrays.texture_coord.forEach( 
        coord =>{ 
                  coord[0] = 5*coord[0]
                  coord[1] = 5*coord[1]
                } );
      
      // *** Shaders ***

      // NOTE: The 2 in each shader argument refers to the max
      // number of lights, which must be known at compile time.
      
      // A simple Phong_Blinn shader without textures:
      const phong_shader      = new defs.Phong_Shader  (2);
      // Adding textures to the previous shader:
      const texture_shader    = new defs.Textured_Phong(2);
      // Same thing, but with a trick to make the textures 
      // seemingly interact with the lights:
      const texture_shader_2  = new defs.Fake_Bump_Map (2);
      // A Simple Gouraud Shader that you will implement:
      const gouraud_shader    = new Gouraud_Shader     (2);
      // Extra credit shaders:
      const black_hole_shader = new Black_Hole_Shader();
      const sun_shader        = new Sun_Shader();
      
                                              // *** Materials: *** wrap a dictionary of "options" for a shader.

                                              // TODO (#2):  Complete this list with any additional materials you need:

      this.materials = { plastic: new Material( phong_shader, 
                                    { ambient: 0, diffusivity: 1, specularity: 0, color: Color.of( 1,.5,1,1 ) } ),
                   plastic_stars: new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/star_face.png" ),
                                      ambient: 1, diffusivity: 0, specularity: 0, color: Color.of( 0,0,0,1 ) } ),
                    black_mirror: new Material( phong_shader, 
                                    { ambient: 0, diffusivity: 0, specularity: 1, color: Color.of( 1,.5,1,1 ) } ),
                           metal: new Material( phong_shader,
                                    { ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( 1,.5,1,1 ) } ),
                     metal_earth: new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/earth.gif" ),
                                      ambient: 0, diffusivity: 1, specularity: .5, color: Color.of( .4,.4,.4,1 ) } ),
                          brick: new Material ( texture_shader_2, 
                                    { texture: new Texture( "assets/bricks.png", "NEAREST"),
                                      ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( .4,.4,.4,1 ),
                                      smoothness: 10  } ),
                          brick_2: new Material ( texture_shader_2, 
                                    { texture: new Texture( "assets/bricks.png" ),
                                      ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( .4,.4,.4,1 ),
                                      smoothness: 10  } ),
                            moon: new Material ( gouraud_shader,   
                                    { ambient: 0, diffusivity: 1, specularity: .5, color: Color.of( .4,.4,.4,1 ) } ), 
                      black_hole: new Material( black_hole_shader ),
                             sun: new Material( phong_shader, { ambient: 1, color: Color.of( 0,0,0,1 ) } )
                       };

                                  // Some setup code that tracks whether the "lights are on" (the stars), and also
                                  // stores 30 random location matrices for drawing stars behind the solar system:
      this.lights_on = false;
      this.star_matrices = [];
      for( let i=0; i<30; i++ )
        this.star_matrices.push( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 0,1,0 ) )
                         .times( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 1,0,0 ) ) )
                         .times( Mat4.translation([ 0,0,-150 ]) ) );
    }
  make_control_panel()
    {                                 // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                      // buttons with key bindings for affecting this scene, and live info readouts.

       // TODO (#5b): Add a button control.  Provide a callback that flips the boolean value of "this.lights_on".
       this.key_triggered_button( "Lights on/off", ["l"], () => { 
         this.lights_on = !this.lights_on;
       } ) 
    }
  display( context, program_state )
    {                                                // display():  Called once per frame of animation.  For each shape that you want to
                                                     // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
                                                     // different matrix value to control where the shape appears.
     
                           // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
      if( !context.scratchpad.controls ) 
        {                       // Add a movement controls panel to the page:
          this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 

                                // Add a helper scene / child scene that allows viewing each moving body up close.
          this.children.push( this.camera_teleporter = new Camera_Teleporter() );

                    // Define the global camera and projection matrices, which are stored in program_state.  The camera
                    // matrix follows the usual format for transforms, but with opposite values (cameras exist as 
                    // inverted matrices).  The projection matrix follows an unusual format and determines how depth is 
                    // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() and
                    // orthographic() automatically generate valid matrices for one.  The input arguments of
                    // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.          
          program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }

                                                                      // Find how much time has passed in seconds; we can use
                                                                      // time as an input when calculating new transforms:
      const t = program_state.animation_time / 1000;

                                                  // Have to reset this for each frame:
      this.camera_teleporter.cameras = [];
      this.camera_teleporter.cameras.push( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );


                                             // Variables that are in scope for you to use:
                                             // this.shapes: Your shapes, defined above.
                                             // this.materials: Your materials, defined above.
                                             // this.lights:  Assign an array of Light objects to this to light up your scene.
                                             // this.lights_on:  A boolean variable that changes when the user presses a button.
                                             // this.camera_teleporter: A child scene that helps you see your planets up close.
                                             //                         For this to work, you must push their inverted matrices
                                             //                         into the "this.camera_teleporter.cameras" array.
                                             // t:  Your program's time in seconds.
                                             // program_state:  Information the shader needs for drawing.  Pass to draw().
                                             // context:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().                                                       


      /**********************************
      Start coding down here!!!!
      **********************************/         

      const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( .5,.5,0,1 );

      // Variable model_transform will be a local matrix value that helps us position shapes.
      // It starts over as the identity every single frame - coordinate axes at the origin.
      let model_transform = Mat4.identity();

      // TODO (#3b):  Use the time-varying value of sun_size to create a scale matrix 
      // for the sun. Also use it to create a color that turns redder as sun_size
      // increases, and bluer as it decreases.
      const smoothly_varying_ratio = .5 + .5 * Math.sin( 2 * Math.PI * t/10 ),
            sun_size = 1 + 2 * smoothly_varying_ratio,
                 sun = this.shapes.sub_6,
           sun_color = Color.of( smoothly_varying_ratio, smoothly_varying_ratio, .5-smoothly_varying_ratio, 1.0);

      model_transform = model_transform.times( Mat4.scale( Vec.of(sun_size, sun_size, sun_size ) ) );
      
      this.materials.sun.color = sun_color;     // Assign our current sun color to the existing sun material.          

                                                // *** Lights: *** Values of vector or point lights.  They'll be consulted by 
                                                // the shader when coloring shapes.  See Light's class definition for inputs.

                                                // TODO (#3c):  Replace with a point light located at the origin, with the sun's color
                                                // (created above).  For the third argument pass in the point light's size.  Use
                                                // 10 to the power of sun_size.
      program_state.lights = [ new Light( Vec.of( 0,0,0,1 ), sun_color, Math.pow( 50, sun_size ) ) ];

      // TODO (#5c):  Throughout your program whenever you use a material (by passing it into draw),
      // pass in a modified version instead.  Call .override( modifier ) on the material to
      // generate a new one that uses the below modifier, replacing the ambient term with a 
      // new value based on our light switch.                         
      const modifier = this.lights_on ? { ambient: 0.3 } : { ambient: 0.0 };

      // TODO (#3d):   Draw the sun using its matrix (crated by you above) and material.
      sun.draw( context, program_state, model_transform, this.materials.sun );
     
      let planets = [ this.shapes.sub_3, this.shapes.sub_2, this.shapes.sub_4, this.shapes.sub_5, this.shapes.sub_5 ];
      let planet_materials = [ this.materials.plastic.override( modifier ), this.materials.black_mirror.override( modifier ) ,  this.materials.metal_earth.override( modifier ), this.materials.brick.override( modifier ), this.materials.brick_2.override( modifier ) ];
      let planet_orbit = [];

      for ( let i = 1; i < 6; i++ ) { 
        let planet_id = i,
        planet_orbit_speed = t/planet_id;
        planet_orbit.push(  model_transform.times( Mat4.rotation( planet_orbit_speed , Vec.of( 0,1,0 ) ) )  //rotation about sun
                                        .times( Mat4.translation( [0, 0, 5 + 3*(i-1) ] ) )
                                        .times( Mat4.rotation( planet_orbit_speed , Vec.of( 0,1,0 ) ) ) ); //rotation
      
        planets[i-1].draw( context, program_state, planet_orbit[i-1], planet_materials[i-1] );

        if ( planet_id === 3 ) { 
          let moon = this.shapes.sub_1,
              moon_orbit_speed = planet_orbit_speed/planet_id, 
              moon_orbit = planet_orbit[i-1].times( Mat4.rotation( moon_orbit_speed , Vec.of( 0,1,0 ) ) )  //rotation about planet
                                        .times( Mat4.translation( [0, 0, 2 ] ) )
                                        .times( Mat4.rotation( moon_orbit_speed , Vec.of( 0,1,0 ) ) );  //rotation)

              moon.draw( context, program_state, moon_orbit, this.materials.moon.override( modifier ) );

        }
      }

      //planar stars
      if (this.lights_on) { 
        let star_locations = this.star_matrices; //location of each star (translate matrices)
        star_locations.forEach( (location) =>  { 
            let star = this.shapes.star,
                star_location = Mat4.identity().times( location ),
                star_material = this.materials.plastic_stars;

            star.draw( context, program_state, star_location, star_material );
         });
      }

       for ( let i = 1; i<6; i++ ) {
          let planet_id = i,
          planet_orbit_speed = t/planet_id;
          this.camera_teleporter.cameras.push( Mat4.inverse( planet_orbit[i-1].times( Mat4.inverse( Mat4.rotation( planet_orbit_speed , Vec.of( 0,1,0 )  )  ) ) 
                                                                              .times( Mat4.translation( [0, 0, 2]) )) ) ;
      }
      // TODO (#4d1):  Draw planet 1 orbiting at 5 units radius, revolving AND rotating at 1 radian/sec.
      // TODO (#4d2):  Draw planet 2 orbiting 3 units farther, revolving AND rotating slower.
      // TODO (#6b1):  Draw moon 1 orbiting 2 units away from planet 2, revolving AND rotating.
      // TODO (#4d3):  Draw planet 3 orbiting 3 units farther, revolving AND rotating slower.
      // TODO (#6b2):  Draw moon 2 orbiting 2 units away from planet 3, revolving AND rotating.                          
      // TODO (#4d4):  Draw planet 4
      // TODO (#4d5):  Draw planet 5

      // TODO (#5a): If the light switch is on, loop through star_matrices and draw 2D stars.

      // TODO (#7b): Give the child scene (camera_teleporter) the *inverted* matrices
      // for each of your objects, mimicking the examples above.  Tweak each
      // matrix a bit so you can see the planet, or maybe appear to be standing
      // on it.  Remember the moons.
      




      // ***** BEGIN TEST SCENE *****               
                                          // TODO:  Delete (or comment out) the rest of display(), starting here:

      // program_state.set_camera( Mat4.translation([ 0,3,-10 ]) );
      // const angle = Math.sin( t );
      // const light_position = Mat4.rotation( angle, [ 1,0,0 ] ).times( Vec.of( 0,-1,1,0 ) );
      // program_state.lights = [ new Light( light_position, Color.of( 1,1,1,1 ), 1000000 ) ];
      // model_transform = Mat4.identity();
      // this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic.override( yellow ) );
      // model_transform.post_multiply( Mat4.translation([ 0, -2, 0 ]) );
      // this.shapes.ball_4.draw( context, program_state, model_transform, this.materials.metal_earth.override( blue ) );
      // model_transform.post_multiply( Mat4.rotation( t, Vec.of( 0,1,0 ) ) )
      // model_transform.post_multiply( Mat4.rotation( 1, Vec.of( 0,0,1 ) )
      //                        .times( Mat4.scale      ([ 1,   2, 1 ]) )
      //                        .times( Mat4.translation([ 0,-1.5, 0 ]) ) );
      // this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic_stars.override( yellow ) );

      // ***** END TEST SCENE *****

      // Warning: Get rid of the test scene, or else the camera position and movement will not work.



    }
}

const Additional_Scenes = [];

export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }


const Camera_Teleporter = defs.Camera_Teleporter =
class Camera_Teleporter extends Scene
{                               // **Camera_Teleporter** is a helper Scene meant to be added as a child to
                                // your own Scene.  It adds a panel of buttons.  Any matrices externally
                                // added to its "this.cameras" can be selected with these buttons. Upon
                                // selection, the program_state's camera matrix slowly (smoothly)
                                // linearly interpolates itself until it matches the selected matrix.
  constructor() 
    { super();
      this.cameras = [];
      this.selection = 0;
    }
  make_control_panel()
    {                                // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                     // buttons with key bindings for affecting this scene, and live info readouts.
      
      this.key_triggered_button(  "Enable",       [ "e" ], () => this.enabled = true  );
      this.key_triggered_button( "Disable", [ "Shift", "E" ], () => this.enabled = false );
      this.new_line();
      this.key_triggered_button( "Previous location", [ "g" ], this.decrease );
      this.key_triggered_button(              "Next", [ "h" ], this.increase );
      this.new_line();
      this.live_string( box => { box.textContent = "Selected camera location: " + this.selection } );
    }  
  increase() { this.selection = Math.min( this.selection + 1, Math.max( this.cameras.length-1, 0 ) ); }
  decrease() { this.selection = Math.max( this.selection - 1, 0 ); }   // Don't allow selection of negative indices.
  display( context, program_state )
  {
    const desired_camera = this.cameras[ this.selection ];
    if( !desired_camera || !this.enabled )
      return;
    const dt = program_state.animation_delta_time;
    program_state.set_camera( desired_camera.map( (x,i) => Vec.from( program_state.camera_inverse[i] ).mix( x, .01*dt ) ) );    
  }
}


const Planar_Star = defs.Planar_Star =
class Planar_Star extends Shape
{                                
   // **Planar_Star** defines a 2D five-pointed star shape.  The star's inner 
   // radius is 4, and its outer radius is 7.  This means the complete star 
   // fits inside a 14 by 14 sqaure, and is centered at the origin.
  constructor()
    { super( "position", "normal", "texture_coord" );
      
      this.arrays.position.push( Vec.of( 0,0,0 ) );
      for( let i = 0; i < 11; i++ )
        {
          const spin = Mat4.rotation( i * 2*Math.PI/10, Vec.of( 0,0,-1 ) );

          const radius = i%2 ? 4 : 7;
          const new_point = spin.times( Vec.of( 0,radius,0,1 ) ).to3();

          this.arrays.position.push( new_point );
          if( i > 0 )
            this.indices.push( 0, i, i+1 )
        }         
                 
      this.arrays.normal  = this.arrays.position.map( p => Vec.of( 0,0,-1 ) );

      // TODO (#5a):  Fill in some reasonable texture coordinates for the star:
      // normalize the position ( -7 , 7 )
      
      this.arrays.texture_coord = this.arrays.position.map( p => Vec.of( (p[0] + 7)/14 , (p[1] + 7)/14 ) );
    }
}

const Gouraud_Shader = defs.Gouraud_Shader =
class Gouraud_Shader extends defs.Phong_Shader
{ 
  shared_glsl_code()           
  // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { 
    // TODO (#6b2.1):  Copy the Phong_Shader class's implementation of this function, but
    // change the two "varying" vec3s declared in it to just one vec4, called color.
    // REMEMBER:
    // **Varying variables** are passed on from the finished vertex shader to the fragment
    // shader.  A different value of a "varying" is produced for every single vertex
    // in your array.  Three vertices make each triangle, producing three distinct answers
    // of what the varying's value should be.  Each triangle produces fragments (pixels), 
    // and the per-fragment shader then runs.  Each fragment that looks up a varying 
    // variable will pull its value from the weighted average of the varying's value
    // from the three vertices of its triangle, weighted according to how close the 
    // fragment is to each extreme corner point (vertex).

    return ` precision mediump float;
    const int N_LIGHTS = ` + this.num_lights + `;
    uniform float ambient, diffusivity, specularity, smoothness;
    uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
    uniform float light_attenuation_factors[N_LIGHTS];
    uniform vec4 shape_color;
    uniform vec3 squared_scale, camera_center;

                          // Specifier "varying" means a variable's final value will be passed from the vertex shader
                          // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
                          // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
    // ***** Gourad SHADING HAPPENS HERE: *****    
    varying vec4 color; ` ;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { 
                                          // TODO (#6b2.2):  Copy the Phong_Shader class's implementation of this function,
                                          // but declare N and vertex_worldspace as vec3s local to function main,
                                          // since they are no longer scoped as varyings.  Then, copy over the
                                          // fragment shader code to the end of main() here.  Computing the Phong
                                          // color here instead of in the fragment shader is called Gouraud
                                          // Shading.  
                                          // Modify any lines that assign to gl_FragColor, to assign them to "color", 
                                          // the varying you made, instead.  You cannot assign to gl_FragColor from 
                                          // within the vertex shader (because it is a special variable for final
                                          // fragment shader color), but you can assign to varyings that will be 
                                          // sent as outputs to the fragment shader.

    

      return this.shared_glsl_code() + `
      attribute vec3 position, normal;                           
      // Position is expressed in object coordinates.
        
      uniform mat4 model_transform;
      uniform mat4 projection_camera_model_transform;
      
      varying vec2 f_tex_coord;
      uniform sampler2D texture;

      vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace )
      {                                        
        vec3 E = normalize( camera_center - vertex_worldspace );
        vec3 result = vec3( 0.0 );
        for(int i = 0; i < N_LIGHTS; i++)
          {
            // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
            // light will appear directional (uniform direction from all points), and we 
            // simply obtain a vector towards the light by directly using the stored value.
            // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
            // the point light's location from the current surface point.  In either case, 
            // fade (attenuate) the light as the vector needed to reach it gets longer.  
            vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                           light_positions_or_vectors[i].w * vertex_worldspace;                                             
            float distance_to_light = length( surface_to_light_vector );

            vec3 L = normalize( surface_to_light_vector );
            vec3 H = normalize( L + E );
                                              // Compute the diffuse and specular components from the Phong
                                              // Reflection Model, using Blinn's "halfway vector" method:
            float diffuse  =      max( dot( N, L ), 0.0 );
            float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
            float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
            
            
            vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                      + light_colors[i].xyz * specularity * specular;

            result += attenuation * light_contribution;
          }
        return result;
      }


      void main()
        { 
          vec3 N, vertex_worldspace;
          // The vertex's final resting place (in NDCS):
          gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                                                                            
          // The final normal vector in screen space.
          N = normalize( mat3( model_transform ) * normal / squared_scale);
          
          vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                                                    
          // Sample the texture image in the correct place:
          vec4 tex_color = texture2D( texture, f_tex_coord );
          //if( tex_color.w < .01 ) discard;
                                                                    
          // Compute an initial (ambient) color:
         color = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                    
          // Compute the final color with contributions from lights:
          color.xyz += phong_model_lights( normalize( N ), vertex_worldspace );

        } ` ;
    }
  fragment_glsl_code()         
  // ********* FRAGMENT SHADER ********* 
    {                          
      // A fragment is a pixel that's overlapped by the current triangle.
      // Fragments affect the final image or get discarded due to depth.  

      // TODO (#6b2.3):  Leave the main function almost blank, except assign gl_FragColor to
      // just equal "color", the varying you made earlier
    
      return this.shared_glsl_code() + `
        void main()
          {
            gl_FragColor = color;
                        
          } ` ;
    }
}


const Black_Hole_Shader = defs.Black_Hole_Shader =
class Black_Hole_Shader extends Shader         // Simple "procedural" texture shader, with texture coordinates but without an input image.
{ update_GPU( context, gpu_addresses, program_state, model_transform, material )
      { 
                  // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader 
                  // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
                  // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or 
                  // program (which we call the "Program_State").  Send both a material and a program state to the shaders 
                  // within this function, one data field at a time, to fully initialize the shader for a draw.

                  // TODO (#EC 1b):  Send the GPU the only matrix it will need for this shader:  The product of the projection, 
                  // camera, and model matrices.  The former two are found in program_state; the latter is directly 
                  // available here.  Finally, pass in the animation_time from program_state. You don't need to allow
                  // custom materials for this part so you don't need any values from the material object.
                  // For an example of how to send variables to the GPU, check out the simple shader "Funny_Shader".

        // context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform,       
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { 
                  // TODO (#EC 1c):  For both shaders, declare a varying vec2 to pass a texture coordinate between
                  // your shaders.  Also make sure both shaders have an animation_time input (a uniform).
      return `precision mediump float;
             
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    {
                          // TODO (#EC 1d,e):  Create the final "gl_Position" value of each vertex based on a displacement
                          // function.  Also pass your texture coordinate to the next shader.  As inputs,
                          // you have the current vertex's stored position and texture coord, animation time,
                          // and the final product of the projection, camera, and model matrices.
      return this.shared_glsl_code() + `

        void main()
        { 

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { 
                          // TODO (#EC 1f):  Using the input UV texture coordinates and animation time,
                          // calculate a color that makes moving waves as V increases.  Store
                          // the result in gl_FragColor.
      return this.shared_glsl_code() + `
        void main()
        { 

        }`;
    }
}


const Sun_Shader = defs.Sun_Shader =
class Sun_Shader extends Shader
{ update_GPU( context, gpu_addresses, graphics_state, model_transform, material )
    {
                      // TODO (#EC 2): Pass the same information to the shader as for EC part 1.  Additionally
                      // pass material.color to the shader.


    }
                                // TODO (#EC 2):  Complete the shaders, displacing the input sphere's vertices as
                                // a fireball effect and coloring fragments according to displacement.

  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
                            
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `

        void main()
        {

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return this.shared_glsl_code() + `
        void main() 
        {

        } ` ;
    }
}