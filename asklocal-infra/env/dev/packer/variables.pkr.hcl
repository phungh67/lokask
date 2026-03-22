variable "region" {
  type        = string
  description = "The AWS region to build the AMI in"
  default     = "us-east-1"
}

variable "instance_type" {
  type        = string
  description = "The EC2 instance type to use for the build"
  default     = "t3.micro"
}

variable "go_version" {
  type        = string
  description = "The version of Go to install"
  default     = "1.26.0" # You can update this to the latest version as needed
}

variable "ami_prefix" {
  type        = string
  description = "The prefix for the generated AMI name"
  default     = "base"
}

variable "region_code" {
  type        = string
  description = "The prefix for naming resources with region"
  default     = "ue1"
}

variable "environment_indicator" {
  type        = string
  description = "Indicate deployment environment"
  default     = "d"
}