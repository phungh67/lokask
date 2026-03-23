variable "instance_count" {
  description = "Number of instance to created"
  type        = number
  default     = 1
}

variable "group_name" {
  description = "Better naming"
  type        = string
}

variable "base_ami" {
  description = "Passed value of AMI ID"
}

variable "vpc_id" {
  description = "The VPC to hold this instance(s)"
}

variable "instance_type" {
  description = "Type of instance to run"
}

variable "machine_net" {
  description = "Subnet-id for main machine"
}

variable "generated_new_ssh_key" {
  description = "Indicate to generate SSH key on run"
}

variable "default_public_ip_to_machine" {
  description = "Quick test, turn it on, otherwise, it is best to leave it as false"
}

variable "open_publicy_ssh" {
  description = "Indicate the ability to SSH directly"
}

