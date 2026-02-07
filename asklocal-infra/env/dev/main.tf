module "networking" {
  source                      = "./modules/networking"
  group_name                  = var.group_name
  region_code                 = var.region_code
  number_of_subnets_per_layer = var.number_of_subnets_per_layer
  main_cidr                   = var.main_cidr
  environment_code            = var.environment_code
  nat_attached                = var.nat_attached
  number_of_layers            = var.number_of_layers
}
