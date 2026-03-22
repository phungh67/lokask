output "main_vpc_id" {
  value = module.networking.main_vpc_id
}

output "list_of_public_subnets" {
  value = module.networking.list_of_public_subnets
}

output "list_of_private_subnets" {
  value = module.networking.list_of_private_subnets
}