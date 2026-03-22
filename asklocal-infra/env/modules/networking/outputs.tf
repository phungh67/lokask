output "main_vpc_id" {
  description = "ID of main VPC created by this module"
  value       = module.customized_vpc.vpc_id
}

output "list_of_public_subnets" {
  description = "The IDs list of public subnets created"
  value       = module.customized_vpc.public_subnet_ids
}

output "list_of_private_subnets" {
  description = "The IDs list of private subnets created"
  value       = module.customized_vpc.private_subnet_ids
}
