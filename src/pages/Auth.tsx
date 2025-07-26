import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Lock, Mail, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
}

interface SignInForm {
  email: string;
  password: string;
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();

  const signUpForm = useForm<SignUpForm>();
  const signInForm = useForm<SignInForm>();

  // Redirect if already authenticated
  if (user) {
    navigate("/");
    return null;
  }

  const handleSignUp = async (data: SignUpForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.nickname);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully! Please check your email to verify your account.");
    }
    setIsLoading(false);
  };

  const handleSignIn = async (data: SignInForm) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Building className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Hangar Guardian
          </h1>
          <p className="text-muted-foreground mt-2">IoT Monitoring System</p>
        </div>

        <Card className="relative card-shadow backdrop-blur-sm bg-card/95 border-border/50">
          <GlowingEffect disabled={false} proximity={100} />
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Register to access the monitoring system" 
                : "Sign in to access your dashboard"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-sm font-medium">
                    Nickname
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nickname"
                      placeholder="Enter your nickname"
                      className="pl-10"
                      {...signUpForm.register("nickname", { required: "Nickname is required" })}
                    />
                  </div>
                  {signUpForm.formState.errors.nickname && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.nickname.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...signUpForm.register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Please enter a valid email"
                        }
                      })}
                    />
                  </div>
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      {...signUpForm.register("password", { 
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters"
                        }
                      })}
                    />
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10"
                      {...signUpForm.register("confirmPassword", { required: "Please confirm your password" })}
                    />
                  </div>
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            ) : (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...signInForm.register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Please enter a valid email"
                        }
                      })}
                    />
                  </div>
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      {...signInForm.register("password", { required: "Password is required" })}
                    />
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="link"
                className="text-primary hover:text-primary/80"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Secure access to your IoT monitoring system
        </p>
      </div>
    </div>
  );
}