variable "region" {
  description = "Main region of this infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "region_code" {
  description = "Indicate which region and for better resources naming"
  type        = string
}

variable "environment_code" {
  # d for developer, s for staging and p for production
  description = "Indicate the type of the environment"
  type        = string
}

# networking block
variable "main_cidr" {
  description = "CIDR block for the main VPC of this infrastructure"
  type        = string
}

variable "number_of_subnets_per_layer" {
  description = "The dersired number of subnets per layer (public, private, database)"
  type        = number
}

variable "number_of_layers" {
  description = "The type of networking architecture, 1 layer, 2 layers or 3 layers"
  type        = number
}

variable "group_name" {
  description = "Helper suffix or prefix to marked this as a customized module"
  type        = string
}

variable "nat_attached" {
  description = "Determine if AWS managed NAT is used"
  type        = number
}

# compute block
variable "instance_count" {
  description = "Number of instance to created"
  type        = number
  default     = 1
}

variable "base_ami" {
  description = "Passed value of AMI ID"
  type        = string
}

variable "instance_type" {
  description = "Type of instance to run"
  type        = string
}

variable "generated_new_ssh_key" {
  description = "Indicate to generate SSH key on run"
  type        = number
}