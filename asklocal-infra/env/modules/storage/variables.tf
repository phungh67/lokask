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

variable "cors_specified" {
  type = number
}

variable "policy_specified" {
  type = number
}

variable "life_cycle_specified" {
  type = number
}
