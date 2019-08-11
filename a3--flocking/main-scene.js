import {tiny, defs} from './assignment-3-resources.js';

const { Vec, Mat, Mat4, Color, Shape, Shader,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Transforms_Sandbox_Base } = defs;

const Main_Scene = defs.Transforms_Sandbox =
class Transforms_Sandbox extends Transforms_Sandbox_Base
{                    
  constructor(){
    super(); 
    //each dragonfly has a position and velocity, fly # corresponds to index
    //array of objects
    this.fly = [];
    this.num = 20;

    //initialize each fly position to zero
    //initialize each fly velocity to a random vector
    for ( var n = 0; n<this.num; n++) { 
        this.fly.push({ 
            position: Vec.of(0,0,0), 
            velocity: Vec.of(Math.random()*2 -1 , Math.random()*2 - 1, Math.random()*2 - 1).times(.005)
        })
    }
   
  }                           
  display( context, program_state )
  {                                                
    super.display( context, program_state );
    const t = this.t = program_state.animation_time/1000;

    let root;
    let num = this.num;

        root = Mat4.identity();
        root = root.times( Mat4.translation([ 0,0,0 ])).times(Mat4.scale([.2,.2,.2]))
        
        if(!this.swarm) {
            this.draw_dragonfly(root, context, program_state,t);     
        }

        else { 
            //draw n dragonflies with different velocities 
            for(var n = 0; n< num; n++){ 
                this.draw_dragonfly(root, context, program_state, t, n); 
            }
           
        }      
    }

    //code for drawing butterfly given a root node
    draw_dragonfly(root, context, program_state, t, n) { 
        const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( 1, 1 , 0, 1 ), blue_green = Color.of(0, .5*Math.sin(t), .5, 1.0 ), orange = Color.of(1.0, .5, 0, 1.0);
        let root_body; 

        if(this.swarm) {

            this.fly[n].position = this.fly[n].position.plus(this.fly[n].velocity.times(program_state.animation_delta_time));

            let right_side_bound = Math.tan(Math.PI/4) * 10 / context.height * context.width;
            let left_side_bound = -1 * right_side_bound;
            let top_bound = Math.tan(Math.PI/4) * this.fly[n].position[2];
            let bottom_bound = -1 * top_bound;
            let front_bound = -1;
            let back_bound = 100;
            
            //wrap outside camera fov (y)
            if( this.fly[n].position[0] > right_side_bound ) { 
            
                this.fly[n].position[0] = -1.0 * this.fly[n].position[0];
            }

            if( this.fly[n].position[0] < left_side_bound ) { 
                this.fly[n].position[0] = -1.0 * this.fly[n].position[0];
            }

            if( this.fly[n].position[1] > top_bound ) {
                this.fly[n].position[1] = -1.0 * this.fly[n].position[1];
            }

            if( this.fly[n].position[1] < bottom_bound ) {
                this.fly[n].position[1] = -1.0 * this.fly[n].position[1];
            }
            
            //look at
            root = root.times( Mat4.translation( this.fly[n].position ).times( Mat4.inverse( Mat4.look_at( Vec.of( 0,0,0 ), this.fly[n].velocity.times(-1), Vec.of( 0,1,0 ) ) ) ))
        }

        else if (!this.hover)
        root = root.times( Mat4.rotation(t, Vec.of(0, -t, 0) )); //rotation about y

        if(this.swarm) {
            root_body = root.times( Mat4.translation([0, 2*Math.sin(t*4), 0])); 
        }

        else if (!this.hover)
        root_body = root.times( Mat4.translation([15, 2*Math.sin(t*4), 17])); //up and down
    
        else { 
            root_body = root;
        }

        this.shapes.box.draw( context, program_state, root_body, this.materials.plastic.override( yellow ) );

        root_body = root_body.times( Mat4.translation([ 3, 0, 0 ]) )
                            .times( Mat4.scale([2,2,2]));            
                                                                            
        this.shapes.ball.draw( context, program_state, root_body, this.materials.metal.override( blue ) );
                                                                        
        root_body = root_body.times( Mat4.translation([ -3, 0, 0 ]) )
                                        

        this.shapes.ball.draw( context, program_state, root_body, this.materials.metal.override( blue ) );

        root_body = root_body.times( Mat4.scale([.5,.5,.5]))
                            .times( Mat4.translation([3,0,0]));

        var i;
            for( i = 0; i < 10; i++) { 
            var angle = .1 + .1*Math.sin(t);
            root_body = root_body.times( Mat4.translation([0,-1.0,-1.0]))

            root_body = root_body.times( Mat4.rotation( - .1 +.1*Math.sin(t*4), Vec.of( t, 0, 0 ) ) );

            root_body = root_body.times( Mat4.translation([0, 1.0, -1.0]))
            this.shapes.box.draw( context, program_state, root_body, this.materials.plastic.override( orange ) );

            //wings
            if( i == 1 || i == 2 ) { 
                let wings, wings_transform;

                root_body = root_body.times( Mat4.translation([1,1,0]))

                wings_transform = root_body.times( Mat4.rotation( .4*Math.sin(t*4), Vec.of( 0, 0, t ) ) )
                                           .times( Mat4.scale([10, .1, .7]));
            
                wings = wings_transform.times( Mat4.translation([1, 1,0]))
                this.shapes.box.draw( context, program_state, wings, this.materials.plastic.override( blue_green ) );
                
                root_body = root_body.times( Mat4.translation([-2,0,0])) 
        
                wings_transform = root_body.times( Mat4.rotation( .4*Math.sin(t*4 + Math.PI), Vec.of( 0, 0, t ) ) )
                                           .times( Mat4.scale([10, .1, .7]));
        

                wings = wings_transform.times( Mat4.translation([-1,1,0]))                              
                this.shapes.box.draw( context, program_state, wings, this.materials.plastic.override( blue_green ) );
                
                root_body = root_body.times( Mat4.translation([1,-1,0]))                 
            }

            //legs 
            if ( i > 0 && i < 4 ) { 
                let tr_legs, br_legs, leg_scale;

                // set initial position
                root_body = root_body.times( Mat4.translation([1,-1,0]) );
                tr_legs = root_body;
            
                tr_legs = tr_legs.times( Mat4.rotation( .1*Math.sin(t*4), Vec.of( 0, 0, t ) ) )
                                 .times( Mat4.translation([.3,-2,0]));
                leg_scale = tr_legs.times(Mat4.scale([.3, 2, .3]))

                this.shapes.box.draw( context, program_state, leg_scale, this.materials.plastic.override( yellow ) );

                br_legs = tr_legs.times( Mat4.translation([-.3, -2, 0]));
            
                br_legs = br_legs.times( Mat4.rotation( -.1 + .1*Math.sin(t*4 + Math.PI), Vec.of( 0, 0, t ) ) )
                                 .times( Mat4.translation([.3,-2,0]));
                leg_scale = br_legs.times(Mat4.scale([.3, 2, .3]));

                this.shapes.box.draw( context, program_state, leg_scale, this.materials.plastic.override( yellow ) );

                root_body = root_body.times( Mat4.translation([-1,1,0]) )
                                     .times( Mat4.translation([-1,-1,0]) );
                
                //left side
                tr_legs = root_body;
                tr_legs = tr_legs.times( Mat4.rotation( .1*Math.sin(t*4 + Math.PI), Vec.of( 0, 0, t ) ) )
                                 .times( Mat4.translation([-.3,-2,0]));

                leg_scale = tr_legs.times(Mat4.scale([.3, 2, .3]));
                this.shapes.box.draw( context, program_state, leg_scale, this.materials.plastic.override( yellow ) );
                    
                br_legs = tr_legs.times( Mat4.translation([.3, -2, 0]));
                br_legs = br_legs.times(Mat4.rotation( .1 - .1*Math.sin(t*4 + Math.PI), Vec.of( 0, 0, t ) ))
                                 .times( Mat4.translation([-.3,-2,0]));

                leg_scale = br_legs.times(Mat4.scale([.3, 2, .3]));
                this.shapes.box.draw( context, program_state, leg_scale, this.materials.plastic.override( yellow ) );

                root_body = root_body.times( Mat4.translation([1,1,0]) );

            }
            }
            
    }


}
const Additional_Scenes = [];

export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }