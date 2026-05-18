module "networking" {
  source                      = "../modules/networking"
  group_name                  = var.group_name
  region_code                 = var.region_code
  number_of_subnets_per_layer = var.number_of_subnets_per_layer
  main_cidr                   = var.main_cidr
  environment_code            = var.environment_code
  nat_attached                = var.nat_attached
  number_of_layers            = var.number_of_layers
}

module "compute" {
  source                       = "../modules/compute"
  machine_net                  = module.networking.list_of_public_subnets[0]
  generated_new_ssh_key        = var.generated_new_ssh_key
  group_name                   = var.group_name
  base_ami                     = var.base_ami
  vpc_id                       = module.networking.main_vpc_id
  instance_type                = var.instance_type
  instance_count               = var.instance_count
  default_public_ip_to_machine = 1
  open_publicy_ssh             = 1

  depends_on = [module.networking]
}

module "storage" {
  source               = "../modules/storage"
  environment_code     = var.environment_code
  policy_specified     = 0
  region_code          = var.region_code
  cors_specified       = 0
  life_cycle_specified = 0
}
