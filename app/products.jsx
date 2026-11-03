import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  deleteProduct,
  deleteProductCategory,
  getAllProducts,
  getProductCategories,
  insertProduct,
  insertProductCategory,
  updateProduct,
  updateProductCategory,
} from '../database/db';
import { deleteProductImage, saveProductImage } from '../utils/productImages';

const EMPTY_PRODUCT = {
  name: '',
  categoryId: null,
  imagePath: null,
  price: '',
  quantity: '0',
  code: '',
};

const CATEGORY_ICONS = [
  { key: 'glasses', label: 'Frames' },
  { key: 'camera-iris', label: 'Power Glasses' },
  { key: 'sunglasses', label: 'Sunglasses' },
  { key: 'shopping', label: 'Accessories' },
];

export default function ProductsPage() {
  const router = useRouter();
  const { categoryId: categoryIdParam } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('glasses');
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const routeCategoryId = Array.isArray(categoryIdParam)
    ? categoryIdParam[0]
    : categoryIdParam;
  const activeCategoryId = routeCategoryId ? Number(routeCategoryId) : null;
  const activeCategory = categories.find(
    (category) => category.id === activeCategoryId,
  );

  const loadCatalog = useCallback(async () => {
    try {
      const [productList, categoryList] = await Promise.all([
        getAllProducts(),
        getProductCategories(),
      ]);
      setProducts(productList);
      setCategories(categoryList);
    } catch (error) {
      console.error('Product catalog load failed', error);
      Toast.show({ type: 'error', text1: 'Could not load products' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [loadCatalog]),
  );

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      ...EMPTY_PRODUCT,
      categoryId: activeCategoryId,
    });
    setImageChanged(false);
    setProductModalVisible(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      categoryId: product.categoryId,
      imagePath: product.imagePath,
      price: String(product.price),
      quantity: String(product.quantity ?? 0),
      code: product.code || '',
    });
    setImageChanged(false);
    setProductModalVisible(true);
  };

  const chooseImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Allow gallery access to choose a photo.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      setProductForm((current) => ({
        ...current,
        imagePath: result.assets[0].uri,
      }));
      setImageChanged(true);
    } catch (error) {
      console.error('Product image selection failed', error);
      Toast.show({
        type: 'error',
        text1: 'Could not select product photo',
        text2: error.message,
      });
    }
  };

  const saveProduct = async () => {
    const name = productForm.name.trim();
    const price = Number(productForm.price);
    if (!name) {
      Toast.show({ type: 'error', text1: 'Enter a product name' });
      return;
    }
    if (!productForm.categoryId) {
      Toast.show({ type: 'error', text1: 'Select a category' });
      return;
    }
    if (
      productForm.price.trim() === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      Toast.show({ type: 'error', text1: 'Enter a valid product price' });
      return;
    }
    const quantity = Number(productForm.quantity);
    if (
      productForm.quantity.trim() === '' ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      Toast.show({ type: 'error', text1: 'Enter a valid stock quantity' });
      return;
    }

    setSaving(true);
    let savedImagePath = null;
    try {
      const imagePath =
        imageChanged && productForm.imagePath
          ? (savedImagePath = await saveProductImage(productForm.imagePath))
          : imageChanged
            ? null
            : productForm.imagePath;
      const productData = {
        ...productForm,
        name,
        price,
        quantity,
        imagePath,
        code: productForm.code.trim(),
      };

      if (editingProduct) {
        await updateProduct({ ...productData, id: editingProduct.id });
      } else {
        await insertProduct(productData);
      }

      savedImagePath = null;
      setProductModalVisible(false);
      await loadCatalog();

      if (editingProduct?.imagePath && editingProduct.imagePath !== imagePath) {
        try {
          await deleteProductImage(editingProduct.imagePath);
        } catch (error) {
          console.error('Previous product image cleanup failed', error);
          Toast.show({
            type: 'error',
            text1: 'Product saved, but the previous photo could not be removed',
          });
          return;
        }
      }

      Toast.show({
        type: 'success',
        text1: editingProduct ? 'Product updated' : 'Product added',
      });
    } catch (error) {
      if (savedImagePath) {
        try {
          await deleteProductImage(savedImagePath);
        } catch (cleanupError) {
          console.error('Unused product image cleanup failed', cleanupError);
        }
      }
      console.error('Product save failed', error);
      Toast.show({
        type: 'error',
        text1: 'Could not save product',
        text2: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      Toast.show({ type: 'error', text1: 'Enter a category name' });
      return;
    }

    try {
      if (editingCategory) {
        await updateProductCategory({
          id: editingCategory.id,
          name,
          icon: categoryIcon,
        });
      } else {
        await insertProductCategory(name, categoryIcon);
      }
      const updatedCategories = await getProductCategories();
      setCategories(updatedCategories);
      closeCategoryModal();
      Toast.show({
        type: 'success',
        text1: editingCategory ? 'Category updated' : 'Category added',
      });
    } catch (error) {
      console.error('Product category save failed', error);
      Toast.show({
        type: 'error',
        text1: editingCategory
          ? 'Could not update category'
          : 'Could not add category',
        text2: error.message,
      });
    }
  };

  const openCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('glasses');
    setCategoryModalVisible(true);
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryIcon(category.icon || 'glasses');
    setCategoryModalVisible(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalVisible(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('glasses');
  };

  const confirmDeleteCategory = (category, productCount) => {
    if (productCount > 0) {
      Alert.alert(
        'Cannot delete category',
        `This category contains ${productCount.toLocaleString('en-US')} products. Delete its products before deleting the category.`,
      );
      return;
    }

    Alert.alert(
      'Delete category?',
      `${category.name} will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProductCategory(category.id);
              if (editingCategory?.id === category.id) closeCategoryModal();
              await loadCatalog();
              Toast.show({ type: 'success', text1: 'Category deleted' });
            } catch (error) {
              console.error('Product category delete failed', error);
              Toast.show({
                type: 'error',
                text1: 'Could not delete category',
                text2: error.message,
              });
            }
          },
        },
      ],
    );
  };

  const confirmDeleteProduct = (product) => {
    Alert.alert(
      'Delete product?',
      `${product.name} will be removed from the list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              setProductModalVisible(false);
              await loadCatalog();
              if (product.imagePath) {
                try {
                  await deleteProductImage(product.imagePath);
                } catch (error) {
                  console.error('Deleted product image cleanup failed', error);
                  Toast.show({
                    type: 'error',
                    text1:
                      'Product deleted, but its photo could not be removed',
                  });
                  return;
                }
              }
              Toast.show({ type: 'success', text1: 'Product deleted' });
            } catch (error) {
              console.error('Product delete failed', error);
              Toast.show({
                type: 'error',
                text1: 'Could not delete product',
                text2: error.message,
              });
            }
          },
        },
      ],
    );
  };

  const visibleProducts = products.filter((product) => {
    const matchesCategory = product.categoryId === activeCategoryId;
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLocaleLowerCase().includes(query) ||
      product.code.toLocaleLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => router.back()}
          accessibilityLabel='Go back'
        >
          <Ionicons name='arrow-back' size={23} color='#2F4F4F' />
        </TouchableOpacity>
        <Text style={styles.title}>
          {activeCategory ? activeCategory.name : 'Product Categories'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color='#2F4F4F' />
      ) : activeCategoryId && activeCategory ? (
        <>
          <View style={styles.productToolbar}>
            <View style={styles.searchBox}>
              <Ionicons name='search-outline' size={19} color='#667085' />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder='Search products'
                placeholderTextColor='#8a9299'
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name='close-circle' size={19} color='#8a9299' />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={openNewProduct}
              accessibilityLabel='Add product'
              accessibilityRole='button'
            >
              <Ionicons name='add' size={28} color='#fff' />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productList}
            keyboardShouldPersistTaps='handled'
          >
            {visibleProducts.length ? (
              visibleProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => openEditProduct(product)}
                  activeOpacity={0.75}
                  accessibilityRole='button'
                  accessibilityLabel={`View or edit ${product.name}`}
                >
                  <View style={styles.productImageFrame}>
                    {product.imagePath ? (
                      <Image
                        source={{ uri: product.imagePath }}
                        style={styles.productImage}
                        resizeMode='cover'
                      />
                    ) : (
                      <View
                        style={[styles.productImage, styles.imagePlaceholder]}
                      >
                        <Feather name='package' size={32} color='#8a9299' />
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>
                      ৳ {Number(product.price).toLocaleString('en-US')}
                    </Text>
                    <View style={styles.productMetaRow}>
                      <Text style={styles.productQuantity}>
                        Stock:{' '}
                        {Number(product.quantity ?? 0).toLocaleString('en-US')}
                      </Text>
                      <Feather name='chevron-right' size={17} color='#8a9299' />
                    </View>
                    {product.code ? (
                      <Text style={styles.productCode} numberOfLines={1}>
                        Code: {product.code}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Feather name='package' size={38} color='#aeb8b8' />
                <Text style={styles.emptyTitle}>
                  {search
                    ? 'No products found'
                    : 'No products in this category'}
                </Text>
                <Text style={styles.emptyDescription}>
                  Tap “Add Product” above to add products to this category.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.categoryHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your Categories</Text>
              <Text style={styles.categoryPageSubtitle}>
                Select a category to view its products
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={openCategoryModal}
              accessibilityRole='button'
              accessibilityLabel='Add category'
            >
              <Ionicons name='add' size={25} color='#fff' />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoryGrid}
          >
            {categories.length ? (
              categories.map((category) => {
                const count = products.filter(
                  (product) => product.categoryId === category.id,
                ).length;
                return (
                  <View key={category.id} style={styles.categoryCard}>
                    <View style={styles.categoryCardActions}>
                      <TouchableOpacity
                        style={styles.categoryActionButton}
                        onPress={() => editCategory(category)}
                        accessibilityLabel={`Edit ${category.name} category`}
                      >
                        <Feather name='edit-2' size={15} color='#2F4F4F' />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.categoryCardContent}
                      onPress={() => router.push(`/products/${category.id}`)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.categoryIcon}>
                        <MaterialCommunityIcons
                          name={category.icon || 'glasses'}
                          size={24}
                          color='#2F4F4F'
                        />
                      </View>
                      <Text style={styles.categoryCardName} numberOfLines={1}>
                        {category.name}
                      </Text>
                      <Text style={styles.categoryCardCount}>
                        {count.toLocaleString('en-US')} products
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Feather name='grid' size={38} color='#aeb8b8' />
                <Text style={styles.emptyTitle}>No categories yet</Text>
                <Text style={styles.emptyDescription}>
                  Create a category to organize your products.
                </Text>
                <TouchableOpacity
                  style={styles.addCategoryButton}
                  onPress={openCategoryModal}
                  accessibilityRole='button'
                  accessibilityLabel='Add category'
                >
                  <Ionicons name='add' size={25} color='#fff' />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </>
      )}

      <Modal
        visible={productModalVisible}
        animationType='slide'
        onRequestClose={() => setProductModalVisible(false)}
      >
        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Product Details' : 'New Product'}
            </Text>
            <View style={styles.modalHeaderActions}>
              {editingProduct ? (
                <TouchableOpacity
                  style={styles.modalDeleteIconButton}
                  onPress={() => confirmDeleteProduct(editingProduct)}
                  accessibilityLabel='Delete product'
                >
                  <Feather name='trash-2' size={18} color='#a10217' />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setProductModalVisible(false)}
                accessibilityLabel='Close product details'
              >
                <Ionicons name='close' size={25} color='#3A3A3C' />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={chooseImage}
            accessibilityLabel='Choose product photo'
          >
            {productForm.imagePath ? (
              <Image
                source={{ uri: productForm.imagePath }}
                style={styles.imagePreview}
                resizeMode='cover'
              />
            ) : (
              <>
                <Feather name='camera' size={25} color='#2F4F4F' />
                <Text style={styles.imagePickerText}>Add Product Photo</Text>
              </>
            )}
          </TouchableOpacity>
          {productForm.imagePath ? (
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => {
                setProductForm((current) => ({ ...current, imagePath: null }));
                setImageChanged(true);
              }}
            >
              <Text style={styles.removeImageText}>Remove Photo</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.selectedCategoryField}>
            <Feather name='grid' size={17} color='#2F4F4F' />
            <Text style={styles.selectedCategoryText}>
              {categories.find(
                (category) => category.id === productForm.categoryId,
              )?.name || activeCategory?.name}
            </Text>
          </View>

          <Text style={styles.inputLabel}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={productForm.name}
            onChangeText={(name) =>
              setProductForm((current) => ({ ...current, name }))
            }
            placeholder='e.g. Metal Frame'
          />

          <Text style={styles.inputLabel}>Price *</Text>
          <TextInput
            style={styles.input}
            value={productForm.price}
            onChangeText={(price) =>
              setProductForm((current) => ({ ...current, price }))
            }
            keyboardType='decimal-pad'
            placeholder='Price in ৳'
          />

          <Text style={styles.inputLabel}>Stock Quantity *</Text>
          <TextInput
            style={styles.input}
            value={productForm.quantity}
            onChangeText={(quantity) =>
              setProductForm((current) => ({ ...current, quantity }))
            }
            keyboardType='number-pad'
            placeholder='Number of items in stock'
          />

          <Text style={styles.inputLabel}>Product Code</Text>
          <TextInput
            style={styles.input}
            value={productForm.code}
            onChangeText={(code) =>
              setProductForm((current) => ({ ...current, code }))
            }
            autoCapitalize='characters'
            placeholder='SKU / Product Code'
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={saveProduct}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'Saving...'
                : editingProduct
                  ? 'Update Product'
                  : 'Save Product'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType='fade'
        onRequestClose={closeCategoryModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.categoryModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <View style={styles.modalHeaderActions}>
                {editingCategory ? (
                  <TouchableOpacity
                    style={styles.modalDeleteIconButton}
                    onPress={() => {
                      const count = products.filter(
                        (product) => product.categoryId === editingCategory.id,
                      ).length;
                      confirmDeleteCategory(editingCategory, count);
                    }}
                    accessibilityLabel='Delete category'
                  >
                    <Feather name='trash-2' size={18} color='#a10217' />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeCategoryModal}
                  accessibilityLabel='Close category editor'
                >
                  <Ionicons name='close' size={25} color='#3A3A3C' />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.input}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder='e.g. Frames, Lenses, Sunglasses'
              autoFocus
            />
            <Text style={styles.categoryIconLabel}>Choose a category icon</Text>
            <View style={styles.categoryIconOptions}>
              {CATEGORY_ICONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.categoryIconOption,
                    categoryIcon === option.key &&
                      styles.categoryIconOptionSelected,
                  ]}
                  onPress={() => setCategoryIcon(option.key)}
                >
                  <MaterialCommunityIcons
                    name={option.key}
                    size={24}
                    color={categoryIcon === option.key ? '#fff' : '#2F4F4F'}
                  />
                  <Text
                    style={[
                      styles.categoryIconOptionText,
                      categoryIcon === option.key &&
                        styles.categoryIconOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.categoryModalActions}>
              <TouchableOpacity
                style={[styles.saveCategoryButton, styles.categoryModalAction]}
                onPress={addCategory}
              >
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  styles.categoryModalAction,
                  styles.cancelCategoryButton,
                ]}
                onPress={closeCategoryModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: { flex: 1, color: '#1B1B1D', fontSize: 21, fontWeight: '700' },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { color: '#1B1B1D', fontSize: 17, fontWeight: '700' },
  categoryPageSubtitle: { color: '#667085', fontSize: 12, marginTop: 4 },
  addCategoryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#2F4F4F',
    elevation: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    paddingBottom: 28,
    flexGrow: 1,
  },
  categoryCard: {
    width: '48%',
    minHeight: 142,
    padding: 10,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5EBE8',
    backgroundColor: '#fff',
    elevation: 1,
  },
  categoryCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  categoryActionButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#F1F4F3',
  },
  categoryCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderRadius: 12,
    backgroundColor: '#E8EFEC',
  },
  categoryCardName: {
    maxWidth: '100%',
    color: '#1B1B1D',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryCardCount: { color: '#667085', fontSize: 11, marginTop: 3 },
  addProductButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#2F4F4F',
    elevation: 2,
  },
  productToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  searchBox: {
    minHeight: 46,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E7E4',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#fff',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1B1B1D', paddingVertical: 9 },
  loader: { marginTop: 40 },
  productList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    paddingBottom: 32,
    flexGrow: 1,
  },
  productCard: {
    width: '48%',
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderColor: '#E4E9E7',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
  },
  productImageFrame: {
    width: '100%',
    height: 138,
    backgroundColor: '#EAEDED',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EAEDED',
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { paddingHorizontal: 10, paddingVertical: 9 },
  productName: { color: '#1B1B1D', fontSize: 14, fontWeight: '700' },
  productPrice: {
    color: '#2F4F4F',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productQuantity: { color: '#667085', fontSize: 11 },
  productCode: { color: '#667085', fontSize: 10, marginTop: 4 },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  emptyTitle: {
    color: '#3A3A3C',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDescription: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalContent: { padding: 18, paddingBottom: 40 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDeleteIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFF1F2',
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { color: '#1B1B1D', fontSize: 19, fontWeight: '700' },
  imagePicker: {
    width: 132,
    height: 132,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F5',
    borderColor: '#D7DCDC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePickerText: {
    color: '#2F4F4F',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  removeImageButton: { alignSelf: 'center', padding: 8 },
  removeImageText: { color: '#a10217', fontSize: 12, fontWeight: '600' },
  inputLabel: {
    color: '#3A3A3C',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d9dfdf',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: '#1B1B1D',
    fontSize: 15,
  },
  selectedCategoryField: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: '#E8EFEC',
  },
  selectedCategoryText: {
    color: '#2F4F4F',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F4F4F',
    borderRadius: 12,
    marginTop: 22,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  categoryModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 16,
  },
  categoryIconLabel: {
    color: '#3A3A3C',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: -8,
  },
  categoryIconOptions: { flexDirection: 'row', gap: 8 },
  categoryIconOption: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 11,
    backgroundColor: '#F7F9F8',
  },
  categoryIconOptionSelected: {
    borderColor: '#2F4F4F',
    backgroundColor: '#2F4F4F',
  },
  categoryIconOptionText: {
    color: '#3A3A3C',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryIconOptionTextSelected: { color: '#fff' },
  categoryModalActions: { flexDirection: 'row', gap: 10 },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEDED',
    borderRadius: 10,
  },
  cancelButtonText: { color: '#3A3A3C', fontWeight: '700' },
  saveCategoryButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F4F4F',
    borderRadius: 10,
  },
});
