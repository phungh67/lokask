module "customized_vpc" {
  source = "github.com/phungh67/customized-terraform-modules//vpc"

  default_region        = var.region
  number_of_subnets     = var.number_of_subnets_per_layer
  number_of_layer       = var.number_of_layers
  original_cidr         = var.main_cidr
  group_name            = var.group_name
  nat_attached          = var.nat_attached
  dedicated_eip_for_nat = 0
}
